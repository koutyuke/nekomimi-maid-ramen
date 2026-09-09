import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { AdminPage } from "./admin-page";

let currentRole = "Admin";
let targetRole = "None";
let changeFails = false;
let listFails = false;
let listRequests = 0;

beforeEach(() => {
  currentRole = "Admin";
  targetRole = "None";
  changeFails = false;
  listFails = false;
  listRequests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
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
      <AdminPage />
    </QueryClientProvider>,
  );
};

describe("SPEC-SYS-008 ロール管理画面", () => {
  it("Staffには管理内容を表示せず、利用者一覧も取得しない", async () => {
    currentRole = "Staff";
    renderPage();
    await screen.findByText("管理ページを閲覧する権限がありません。");
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
    fireEvent.click(screen.getByRole("button", { name: "対象者のロールを変更" }));
    await screen.findByRole("alert");
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

  it("一覧取得に失敗した場合に再試行でき、権限剥奪後は一覧を隠す", async () => {
    listFails = true;
    renderPage();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "エラーを閉じる" }));
    expect(screen.queryByRole("alert")).toBeNull();
    listFails = false;
    fireEvent.click(screen.getByRole("button", { name: "利用者一覧を再読み込み" }));
    await screen.findByRole("combobox", { name: "対象者のロール" });
    currentRole = "None";
    fireEvent.click(screen.getByRole("button", { name: "権限を再確認" }));
    await screen.findByText("管理ページを閲覧する権限がありません。");
    expect(screen.queryByRole("table")).toBeNull();
  });
});
