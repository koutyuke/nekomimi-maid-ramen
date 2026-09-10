import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { StaffPage } from "./staff-page";

let loggedIn = true;
let logoutFails = false;
let sessionFails = false;
let currentRole = "Staff";

beforeEach(() => {
  loggedIn = true;
  logoutFails = false;
  sessionFails = false;
  currentRole = "Staff";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        if (sessionFails) {
          return Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 500 });
        }
        return Response.json({
          staff: loggedIn
            ? { id: "test-staff", name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp", role: currentRole }
            : null,
        });
      }
      if (url.endsWith("/auth/logout")) {
        if (logoutFails) {
          return Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 500 });
        }
        loggedIn = false;
        return Response.json({ success: true });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(["private-orders"], [{ id: "sensitive-order" }]);
  render(
    <QueryClientProvider client={queryClient}>
      <StaffPage />
    </QueryClientProvider>,
  );
  return queryClient;
};

describe("SPEC-SYS-006 ログアウトと認証状態の表示", () => {
  it("ログアウト成功後は前の担当者のキャッシュを消し、ログインを案内する", async () => {
    const queryClient = renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "ログアウト" }));
    await screen.findByRole("button", { name: "Googleでログイン" });
    expect(queryClient.getQueryData(["private-orders"])).toBeUndefined();
    expect(screen.queryByText("担当者さん")).toBeNull();
  });
  it("ログアウト失敗時は完了扱いにせず、再試行できる", async () => {
    logoutFails = true;
    const queryClient = renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "ログアウト" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Googleでログイン" })).toBeNull();
    expect(queryClient.getQueryData(["private-orders"])).toBeDefined();
    expect(screen.queryByText("PRIVATE_INTERNAL_ERROR")).toBeNull();
    logoutFails = false;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "ログアウト" }).hasAttribute("disabled")).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    await screen.findByRole("button", { name: "Googleでログイン" });
  });
  it("セッション確認の失敗を未ログインと混同せず、再確認できる", async () => {
    sessionFails = true;
    renderPage();
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Googleでログイン" })).toBeNull();
    expect(screen.queryByText("PRIVATE_INTERNAL_ERROR")).toBeNull();
    sessionFails = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByRole("button", { name: "ログアウト" });
  });
});

describe("SPEC-SYS-008 管理ページへの導線", () => {
  it("Adminには管理ページへのリンクを表示する", async () => {
    currentRole = "Admin";
    renderPage();
    expect((await screen.findByRole("link", { name: "管理ページ" })).getAttribute("href")).toBe("/admin");
  });
  it("Staffには管理ページへのリンクを表示しない", async () => {
    currentRole = "Staff";
    renderPage();
    await screen.findByRole("region", { name: "ログイン中のスタッフ" });
    expect(screen.queryByRole("link", { name: "管理ページ" })).toBeNull();
  });
});
