import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { kitchenPageFixture } from "../testing";
import { useKitchen } from "./use-kitchen";

class TestEventSource extends EventTarget {
  static instances: TestEventSource[] = [];
  close = vi.fn();
  constructor(_url: URL, _options: EventSourceInit) {
    super();
    TestEventSource.instances.push(this);
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  TestEventSource.instances = [];
});
const setup = (role = "Staff") => {
  let orders = kitchenPageFixture.orders;
  let failUpdate = false;
  let listWait: Promise<void> | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/auth/session")) {
      return Response.json({ staff: { id: "staff-1", role, name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp" } });
    }
    if (init?.method?.toUpperCase() === "PATCH") {
      if (failUpdate) {
        return Response.json({ code: "kitchen_order_conflict" }, { status: 409 });
      }
      return Response.json({ id: "order-1", cookingState: "cooking" });
    }
    if (/\/orders\?businessDate=\d{4}-\d{2}-\d{2}$/.test(url)) {
      await listWait;
      return Response.json({ orders });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("EventSource", TestEventSource);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const hook = renderHook(() => useKitchen(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return {
    ...hook,
    fetch,
    holdList: () => {
      let release: (() => void) | undefined;
      listWait = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => release?.();
    },
    setOrders: (next: typeof orders) => {
      orders = next;
    },
    rejectUpdate: () => {
      failUpdate = true;
    },
  };
};

describe("SPEC-KIT-002 調理画面の通信と再確認", () => {
  it("日本時間の当日を指定して一覧を取得する", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(3));
    const businessDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    expect(
      hook.fetch.mock.calls.some(([input]) =>
        (input instanceof Request ? input.url : String(input)).endsWith(`/orders?businessDate=${businessDate}`),
      ),
    ).toBe(true);
    hook.unmount();
  });

  it("注文全体ではなく、選んだ明細の識別子と変更先を送る", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(3));
    const order = { ...kitchenPageFixture.orders[0]!, cookingState: "cooking" as const };
    hook.setOrders([order]);
    act(() => {
      TestEventSource.instances[0]!.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(1));
    await waitFor(() => expect(hook.result.current.pending).toBe(false));
    act(() => hook.result.current.actions.onUpdate(order, order.lines[0]!, "cooking"));
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(true),
    );
    const [url, init] = hook.fetch.mock.calls.find(([, options]) => options?.method?.toUpperCase() === "PATCH")!;
    expect(url instanceof Request ? url.url : String(url)).toContain("/orders/order-1/lines/ramen/cooking-state");
    expect(init?.body).toBe(JSON.stringify({ to: "cooking" }));
    hook.unmount();
  });
  it("Noneでは一覧取得も通知接続も始めない", async () => {
    const hook = setup("None");
    await waitFor(() => expect(hook.result.current.access).toBe("denied"));
    expect(TestEventSource.instances).toHaveLength(0);
    expect(hook.fetch).toHaveBeenCalledTimes(1);
    hook.unmount();
  });
  it("通知で他端末の変更を取得し、切断中は更新を送らず、離脱時に接続を閉じる", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(3));
    const source = TestEventSource.instances[0]!;
    act(() => {
      source.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.connected).toBe(true));
    hook.setOrders([]);
    act(() => {
      source.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.orders).toEqual([]));
    act(() => {
      source.dispatchEvent(new Event("error"));
    });
    expect(hook.result.current.connected).toBe(false);
    const before = hook.fetch.mock.calls.length;
    act(() =>
      hook.result.current.actions.onUpdate(
        kitchenPageFixture.orders[0]!,
        kitchenPageFixture.orders[0]!.lines[0]!,
        "cooking",
      ),
    );
    expect(hook.fetch.mock.calls).toHaveLength(before);
    hook.unmount();
    expect(source.close).toHaveBeenCalledOnce();
  });
  it("再接続後の一覧が届くまでは古い状態で更新しない", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(3));
    const release = hook.holdList();
    act(() => {
      TestEventSource.instances[0]!.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.connected).toBe(true));
    act(() =>
      hook.result.current.actions.onUpdate(
        kitchenPageFixture.orders[0]!,
        kitchenPageFixture.orders[0]!.lines[0]!,
        "cooking",
      ),
    );
    expect(hook.result.current.pending).toBe(true);
    expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(false);
    release();
    hook.unmount();
  });
  it("競合を成功表示せず、最新の注文を取り直す", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(3));
    act(() => {
      TestEventSource.instances[0]!.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.connected).toBe(true));
    hook.rejectUpdate();
    hook.setOrders(kitchenPageFixture.orders.map((order) => ({ ...order, cookingState: "completed" })));
    act(() =>
      hook.result.current.actions.onUpdate(
        kitchenPageFixture.orders[0]!,
        kitchenPageFixture.orders[0]!.lines[0]!,
        "cooking",
      ),
    );
    await waitFor(() => expect(hook.result.current.error).toContain("状態または権限"));
    expect(hook.result.current.message).toBeNull();
    await waitFor(() => expect(hook.result.current.orders[0]?.cookingState).toBe("completed"));
    hook.unmount();
  });
});
