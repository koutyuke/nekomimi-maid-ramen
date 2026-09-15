import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "../routeTree.gen";
import { render } from "./render";

afterEach(() => vi.unstubAllGlobals());

const open = (path: string) => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
};

describe("SPEC-SYS-006 未認証時のスタッフ画面への案内", () => {
  it.each(["/staff-management", "/inventory-management", "/order-management", "/sales", "/kitchen", "/handoff"])(
    "%sからログイン画面へ戻し、業務データを取得しない",
    async (path) => {
      const fetch = vi.fn(async (input: RequestInfo | URL) => {
        expect(input instanceof Request ? input.url : input.toString()).toContain("/auth/session");
        return Response.json({ staff: null });
      });
      vi.stubGlobal("fetch", fetch);
      const router = open(path);
      await screen.findByRole("button", { name: "Googleでログイン" });
      expect(router.state.location.pathname).toBe("/");
      expect(screen.queryByText("権限がありません")).toBeNull();
    },
  );
  it("認証の通信失敗でログイン画面へ飛ばさず、再試行後に未認証と判定する", async () => {
    let failed = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (failed ? Response.json({}, { status: 500 }) : Response.json({ staff: null }))),
    );
    const router = open("/sales");
    await screen.findByRole("alert");
    expect(router.state.location.pathname).toBe("/sales");
    failed = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByRole("button", { name: "Googleでログイン" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });
});

describe("スタッフ画面内の移動", () => {
  it("注文・会計へページを再読込せずに移動する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : input.toString();
        if (url.endsWith("/auth/session")) {
          return Response.json({
            staff: { id: "test-staff", name: "担当者", email: "staff@example.com", role: "Staff" },
          });
        }
        if (url.endsWith("/menu")) {
          return Response.json({ items: [], revision: 1 });
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
    const router = open("/");

    fireEvent.click(await screen.findByRole("link", { name: "注文・会計" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/sales"));
    await screen.findByRole("heading", { name: "注文・会計" });
  });

  it("Adminはトップから各管理画面へ移動できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : input.toString();
        if (url.endsWith("/auth/session")) {
          return Response.json({
            staff: { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" },
          });
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
    open("/");

    expect((await screen.findByRole("link", { name: "スタッフ管理" })).getAttribute("href")).toBe("/staff-management");
    expect(screen.getByRole("link", { name: "在庫管理" }).getAttribute("href")).toBe("/inventory-management");
    expect(screen.getByRole("link", { name: "注文管理" }).getAttribute("href")).toBe("/order-management");
  });

  it.each(["/staff-management", "/inventory-management"])(
    "Staffが%sを直接開いても管理データを取得しない",
    async (path) => {
      const fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : input.toString();
        if (url.endsWith("/auth/session")) {
          return Response.json({
            staff: { id: "staff", name: "担当者", email: "staff@example.com", role: "Staff" },
          });
        }
        throw new Error(`Unexpected request: ${url}`);
      });
      vi.stubGlobal("fetch", fetch);
      open(path);

      await screen.findByRole("alert", { name: "権限がありません" });
      expect(
        fetch.mock.calls.every(([input]) =>
          (input instanceof Request ? input.url : input.toString()).endsWith("/auth/session"),
        ),
      ).toBe(true);
    },
  );
});

describe("SPEC-SYS-006 共通ヘッダーの認証操作", () => {
  it.each(["Owner", "Admin", "Staff", "None"])(
    "%sの業務画面のメニューでもロール別の導線を表示し、ログアウトできる",
    async (role) => {
      let loggedIn = true;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          const url = input instanceof Request ? input.url : input.toString();
          if (url.endsWith("/auth/session")) {
            return Response.json({
              staff: loggedIn ? { id: "staff", name: "担当者", email: "staff@example.com", role } : null,
            });
          }
          if (url.endsWith("/auth/logout")) {
            loggedIn = false;
            return Response.json({ success: true });
          }
          if (url.endsWith("/menu")) {
            return Response.json({ items: [], revision: 1 });
          }
          throw new Error(`Unexpected request: ${url}`);
        }),
      );
      const router = open("/sales");
      fireEvent.click(await screen.findByRole("button", { name: "メニュー" }));
      const menu = within(screen.getByRole("region", { name: "スタッフメニュー" }));
      await menu.findByRole("button", { name: "ログアウト" });
      expect(menu.queryByRole("link", { name: "在庫管理" }) !== null).toBe(role === "Owner" || role === "Admin");
      expect(menu.queryByRole("link", { name: "注文管理" }) !== null).toBe(role !== "None");
      fireEvent.click(menu.getByRole("button", { name: "ログアウト" }));
      await screen.findByRole("button", { name: "Googleでログイン" });
      await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    },
  );
});
