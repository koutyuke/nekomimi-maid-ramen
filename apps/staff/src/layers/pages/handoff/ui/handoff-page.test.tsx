import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { AuthGuard } from "../../../widgets/auth-guard";
import { handoffOrdersFixture } from "../testing";
import { HandoffPage } from "./handoff-page";

afterEach(() => {
  vi.unstubAllGlobals();
  TestWebSocket.instances = [];
});

it("SPEC-HAND-002 SPEC-HAND-003 ドリンク更新と受け渡しを記録し、アクセス拒否から表示設定を保って復帰する", async () => {
  let denied = false;
  let orders = handoffOrdersFixture;
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
      orders = orders.map((order) =>
        order.id === "order-2"
          ? Object.assign({}, order, {
              lines: order.lines.map((line) =>
                line.menuItemId === "cola" ? Object.assign({}, line, { cookingState: "cooking" as const }) : line,
              ),
            })
          : order,
      );
      return Response.json({ id: "order-2", menuItemId: "cola", cookingState: "cooking" });
    }
    if (init?.method === "POST") {
      orders = orders.map((order) =>
        order.id === "order-1"
          ? Object.assign({}, order, {
              handedOffAt: "2026-10-24T02:00:00Z",
            })
          : order,
      );
      return Response.json({ id: "order-1", handedOffAt: "2026-10-24T02:00:00Z" });
    }
    if (url.includes("/staff/orders?businessDate=")) {
      return denied
        ? Response.json({ message: "PRIVATE_ERROR" }, { status: 403 })
        : Response.json({ orders, revision: 1 });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", TestWebSocket);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthGuard permission="Staff">
        <HandoffPage />
      </AuthGuard>
    </QueryClientProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "注文2のコーラの調理を開始" }));
  await waitFor(() =>
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "注文2のコーラを完成" }).disabled).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }));
  expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "はい、受け渡しを完了する" }));
  await waitFor(() => expect(screen.queryByRole("article", { name: "注文1" })).toBeNull());
  const updates = fetch.mock.calls.filter(([, init]) => init?.method === "PATCH");
  expect(updates).toHaveLength(1);
  const updateURL = updates[0]![0];
  expect(updateURL instanceof Request ? updateURL.url : String(updateURL)).toContain(
    "/staff/orders/order-2/lines/cola/cooking-state",
  );
  expect(updates[0]![1]?.body).toBe(JSON.stringify({ to: "cooking" }));
  const completions = fetch.mock.calls.filter(([, init]) => init?.method === "POST");
  expect(completions).toHaveLength(1);
  const completeURL = completions[0]![0];
  expect(completeURL instanceof Request ? completeURL.url : String(completeURL)).toContain(
    "/staff/orders/order-1/handoff",
  );

  fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
  expect(within(screen.getByRole("article", { name: "注文1" })).queryByRole("button")).toBeNull();
  denied = true;
  fireEvent.click(screen.getByRole("button", { name: "注文情報を更新" }));
  await screen.findByText(/注文情報へのアクセスが拒否されました/);
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.queryByText("PRIVATE_ERROR")).toBeNull();
  denied = false;
  fireEvent.click(screen.getByRole("button", { name: "注文情報を更新" }));
  await screen.findByRole("article", { name: "注文1" });
  expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "完了を非表示" }).checked).toBe(false);
  expect(within(screen.getByRole("article", { name: "注文1" })).queryByRole("button")).toBeNull();
});
