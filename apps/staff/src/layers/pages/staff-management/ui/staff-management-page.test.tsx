import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { AuthGuard } from "../../../widgets/auth-guard";
import { StaffManagementPage } from "./staff-management-page";

let currentRole = "Admin";
let targetRole = "None";
let changeFails = false;
let listFails = false;
let listRequests = 0;
let sessionRequests = 0;
let updateWait: Promise<void> | undefined;

beforeEach(() => {
  currentRole = "Admin";
  targetRole = "None";
  changeFails = false;
  listFails = false;
  listRequests = 0;
  sessionRequests = 0;
  updateWait = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        sessionRequests += 1;
        return Response.json({
          staff: { id: "test-staff", name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp", role: currentRole },
        });
      }
      if (url.endsWith("/staff")) {
        listRequests += 1;
        if (listFails) {
          return Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 500 });
        }
        return Response.json({
          staff: [
            { id: "test-staff", name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp", role: currentRole },
            { id: "owner", name: "オーナー", email: "owner@gm.ibaraki-ct.ac.jp", role: "Owner" },
            { id: "target", name: "対象者", email: "target@gm.ibaraki-ct.ac.jp", role: targetRole },
          ],
        });
      }
      if (url.endsWith("/staff/target/role")) {
        await updateWait;
        if (changeFails) {
          return Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 403 });
        }
        if (typeof init?.body !== "string") {
          throw new Error("Expected JSON body");
        }
        const body: unknown = JSON.parse(init.body);
        if (typeof body === "object" && body !== null && "role" in body && typeof body.role === "string") {
          targetRole = body.role;
        }
        return Response.json({
          staff: { id: "target", name: "対象者", email: "target@gm.ibaraki-ct.ac.jp", role: targetRole },
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthGuard permission="Admin">
        <StaffManagementPage />
      </AuthGuard>
    </QueryClientProvider>,
  );
};

describe("SPEC-SYS-008 ロール管理画面", () => {
  it("Staffには管理内容を表示せず、利用者一覧も取得しない", async () => {
    currentRole = "Staff";
    renderPage();
    await screen.findByText("このページを閲覧する権限がありません。");
    expect(screen.queryByRole("table")).toBeNull();
    expect(listRequests).toBe(0);
  });

  it("管理者は利用者の情報を表で確認し、他人のロールを変更できる", async () => {
    renderPage();
    const table = await screen.findByRole("table", { name: "利用者一覧" });
    expect(table).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "氏名" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "メールアドレス" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "ロール" })).toBeDefined();
    expect(
      within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent),
    ).toEqual(["オーナー", "担当者 (You)", "対象者"]);
    expect(screen.getByText("Owner").closest(".mantine-Badge-root")).not.toBeNull();
    const select = screen.getByRole("combobox", { name: "対象者のロール" });
    expect(screen.queryByRole("option", { name: "Admin" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "オーナーのロール" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "担当者のロール" })).toBeNull();
    fireEvent.change(select, { target: { value: "Staff" } });
    fireEvent.click(screen.getByRole("button", { name: "対象者のロールを変更" }));
    await screen.findByText("対象者のロールをStaffに変更しました。");
    expect(targetRole).toBe("Staff");
    fireEvent.click(screen.getByRole("button", { name: "更新結果を閉じる" }));
    expect(screen.queryByText("対象者のロールをStaffに変更しました。")).toBeNull();
  });

  it("Adminには他のAdminの変更操作を表示しない", async () => {
    targetRole = "Admin";
    renderPage();
    await screen.findByText("target@gm.ibaraki-ct.ac.jp");
    expect(screen.queryByRole("combobox", { name: "対象者のロール" })).toBeNull();
  });

  it("変更拒否を成功扱いにせず再試行できる", async () => {
    currentRole = "Owner";
    changeFails = true;
    renderPage();
    fireEvent.change(await screen.findByRole("combobox", { name: "対象者のロール" }), { target: { value: "Admin" } });
    const previousListRequests = listRequests;
    const previousSessionRequests = sessionRequests;
    fireEvent.click(screen.getByRole("button", { name: "対象者のロールを変更" }));
    await screen.findByRole("alert");
    expect(listRequests).toBeGreaterThan(previousListRequests);
    expect(sessionRequests).toBeGreaterThan(previousSessionRequests);
    expect(targetRole).toBe("None");
    fireEvent.click(screen.getByRole("button", { name: "エラーを閉じる" }));
    expect(screen.queryByRole("alert")).toBeNull();
    changeFails = false;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "対象者のロールを変更" }).hasAttribute("disabled")).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "対象者のロールを変更" }));
    await screen.findByText("対象者のロールをAdminに変更しました。");
  });

  it("再読み込みで一覧取得を再試行でき、権限剥奪も反映して一覧を隠す", async () => {
    listFails = true;
    renderPage();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "エラーを閉じる" }));
    expect(screen.queryByRole("alert")).toBeNull();
    listFails = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByRole("combobox", { name: "対象者のロール" });
    currentRole = "None";
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByText("このページを閲覧する権限がありません。");
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("更新中は入力と再読み込みを無効にし、完了後に操作を再開できる", async () => {
    let release: (() => void) | undefined;
    updateWait = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderPage();
    const select = await screen.findByRole("combobox", { name: "対象者のロール" });
    fireEvent.change(select, { target: { value: "Staff" } });
    fireEvent.click(screen.getByRole("button", { name: "対象者のロールを変更" }));
    await waitFor(() => expect(select.hasAttribute("disabled")).toBe(true));
    expect(screen.getByRole("button", { name: "再読み込み" }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("ロールを変更しました")).toBeNull();

    await act(async () => release?.());
    await screen.findByText("対象者のロールをStaffに変更しました。");
    expect(screen.getByRole("combobox", { name: "対象者のロール" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "再読み込み" }).hasAttribute("disabled")).toBe(false);
  });
});
