import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { InventoryManagementPage } from "./inventory-management-page";

let quantity = 8;
let revision = 1;

beforeEach(() => {
  quantity = 8;
  revision = 1;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        return Response.json({
          staff: { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" },
        });
      }
      if (url.endsWith("/staff/menu/revision")) {
        return Response.json({ revision });
      }
      if (url.endsWith("/staff/menu")) {
        return Response.json({
          revision,
          items: [{ id: "ramen", name: "ラーメン", price: 500, sellable: quantity > 0, quantity }],
        });
      }
      if (url.endsWith("/staff/menu/ramen/stock") && init?.method === "PUT") {
        if (typeof init.body !== "string") {
          throw new Error("Expected JSON body");
        }
        const body: unknown = JSON.parse(init.body);
        if (typeof body !== "object" || body === null || !("quantity" in body) || typeof body.quantity !== "number") {
          throw new Error("Expected quantity");
        }
        const previousQuantity = quantity;
        quantity = body.quantity;
        return Response.json({
          menuItemId: "ramen",
          previousQuantity,
          quantity,
          adjustedAt: new Date().toISOString(),
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("SPEC-INV-004 在庫管理画面", () => {
  it("数え直した現在数で在庫を上書きし、最新値を表示する", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InventoryManagementPage />
      </QueryClientProvider>,
    );

    fireEvent.change(await screen.findByRole("textbox", { name: "ラーメンの現在在庫数" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));

    await screen.findByText("ラーメンの在庫を8個から3個へ更新しました。");
    expect(quantity).toBe(3);
  });

  it("別端末の在庫変更通知を受けて現在数を更新する", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InventoryManagementPage />
      </QueryClientProvider>,
    );
    await screen.findByText("8個");

    quantity = 5;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));

    await screen.findByText("5個");
  });
});
