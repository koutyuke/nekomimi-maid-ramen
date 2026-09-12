import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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
  it.each(["/admin", "/sales", "/kitchen", "/handoff"])(
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
  });
});
