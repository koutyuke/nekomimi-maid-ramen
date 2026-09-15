import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { AuthGuard, PermissionGuard } from "../../../widgets/auth-guard";
import { kitchenOrdersFixture } from "../testing";
import { KitchenPage } from "./kitchen-page";

afterEach(() => {
  vi.unstubAllGlobals();
  TestWebSocket.instances = [];
});

it("SPEC-KIT-002 明細を更新し、アクセス拒否から再取得で復帰する", async () => {
  let denied = false;
  let cookingState = "unstarted";
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/auth/session")) {
      return Response.json({
        staff: { id: "staff-1", role: "Staff", name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp" },
      });
    }
    if (url.endsWith("/staff/orders/revision")) {
      return Response.json({ revision: 1 });
    }
    if (init?.method === "PATCH") {
      cookingState = "cooking";
      return Response.json({ id: "order-1", menuItemId: "gyoza", cookingState });
    }
    if (url.includes("/staff/orders?businessDate=")) {
      if (denied) {
        return Response.json({ message: "PRIVATE_ERROR" }, { status: 403 });
      }
      const order = kitchenOrdersFixture[0]!;
      return Response.json({
        orders: [{ ...order, lines: order.lines.map((line) => Object.assign({}, line, { cookingState })) }],
        revision: 1,
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", TestWebSocket);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthGuard>
        <PermissionGuard permission="Staff">
          <KitchenPage />
        </PermissionGuard>
      </AuthGuard>
    </QueryClientProvider>,
  );
  await screen.findByRole("article", { name: "注文1" });
  fireEvent.click(screen.getByRole("button", { name: "注文1の餃子の調理を開始" }));
  await waitFor(() =>
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "注文1の餃子を完成" }).disabled).toBe(false),
  );
  const updates = fetch.mock.calls.filter(([, init]) => init?.method === "PATCH");
  expect(updates).toHaveLength(1);
  const updateURL = updates[0]![0];
  expect(updateURL instanceof Request ? updateURL.url : String(updateURL)).toContain(
    "/staff/orders/order-1/lines/gyoza/cooking-state",
  );
  expect(updates[0]![1]?.body).toBe(JSON.stringify({ to: "cooking" }));

  denied = true;
  fireEvent.click(screen.getByRole("button", { name: "注文情報を更新" }));
  await screen.findByText(/注文情報へのアクセスが拒否されました/);
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.queryByText("PRIVATE_ERROR")).toBeNull();
  denied = false;
  fireEvent.click(screen.getByRole("button", { name: "注文情報を更新" }));
  await waitFor(() =>
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "注文1の餃子を完成" }).disabled).toBe(false),
  );
});
