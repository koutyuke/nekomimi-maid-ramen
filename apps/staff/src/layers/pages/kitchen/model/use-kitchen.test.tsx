import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { AuthGuard } from "../../../widgets/auth-guard";
import { kitchenOrdersFixture } from "../testing";
import { useKitchen } from "./use-kitchen";

const Kitchen = () => {
  useKitchen();
  return null;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestWebSocket.instances = [];
});
const setup = () => {
  let revision = 1;
  let orders = kitchenOrdersFixture;
  let failUpdate = false;
  let listStatus = 200;
  let revisionStatus = 200;
  let listWait: Promise<void> | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/staff/orders/revision")) {
      return Response.json({ revision }, { status: revisionStatus });
    }
    if (init?.method?.toUpperCase() === "PATCH") {
      if (failUpdate) {
        return Response.json({ code: "kitchen_order_conflict" }, { status: 409 });
      }
      return Response.json({ id: "order-1", cookingState: "cooking" });
    }
    if (/\/orders\?businessDate=\d{4}-\d{2}-\d{2}$/.test(url)) {
      await listWait;
      return Response.json({ orders, revision }, { status: listStatus });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", TestWebSocket);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const hook = renderHook(() => useKitchen(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return {
    ...hook,
    fetch,
    setListStatus: (status: number) => {
      listStatus = status;
    },
    setRevisionStatus: (status: number) => {
      revisionStatus = status;
    },
    holdList: () => {
      let release: (() => void) | undefined;
      listWait = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => release?.();
    },
    setOrders: (next: typeof orders) => {
      orders = next;
      revision += 1;
    },
    rejectUpdate: () => {
      failUpdate = true;
    },
  };
};

describe("SPEC-KIT-002 調理画面の通信と再確認", () => {
  it("再取得中も更新対象だけを処理中にし、同じ明細の連打を防いで別明細を更新できる", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const order = kitchenOrdersFixture[0]!;
    const release = hook.holdList();
    act(() => {
      hook.result.current.cooking.update(order.id, order.lines[0]!.menuItemId, "cooking");
      hook.result.current.cooking.update(order.id, order.lines[0]!.menuItemId, "cooking");
    });
    await waitFor(() =>
      expect(hook.result.current.cooking.pendingLines).toEqual([{ orderId: order.id, menuItemId: "ramen" }]),
    );
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
    act(() => hook.result.current.cooking.update(order.id, order.lines[1]!.menuItemId, "cooking"));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(2));
    expect(hook.result.current.cooking.pendingLines).toEqual([
      { orderId: order.id, menuItemId: "ramen" },
      { orderId: order.id, menuItemId: "gyoza" },
    ]);
    expect(hook.result.current.orders.status).toBe("success");
    release();
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toEqual([]));
    hook.unmount();
  });
  it("日本時間の当日を指定して一覧を取得する", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const businessDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    expect(
      hook.fetch.mock.calls.some(([input]) =>
        (input instanceof Request ? input.url : String(input)).endsWith(`/staff/orders?businessDate=${businessDate}`),
      ),
    ).toBe(true);
    hook.unmount();
  });

  it("注文全体ではなく、選んだ明細の識別子と変更先を送る", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const order = { ...kitchenOrdersFixture[0]!, cookingState: "cooking" as const };
    hook.setOrders([order]);
    act(() => {
      TestWebSocket.instances[0]!.open();
    });
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(1));
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toEqual([]));
    act(() => hook.result.current.cooking.update(order.id, order.lines[0]!.menuItemId, "cooking"));
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(true),
    );
    const [url, init] = hook.fetch.mock.calls.find(([, options]) => options?.method?.toUpperCase() === "PATCH")!;
    expect(url instanceof Request ? url.url : String(url)).toContain("/staff/orders/order-1/lines/ramen/cooking-state");
    expect(init?.body).toBe(JSON.stringify({ to: "cooking" }));
    hook.unmount();
  });
  it("AuthGuardがNoneを拒否し、一覧取得も通知接続も始めない", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        staff: { id: "staff-1", role: "None", name: "担当者", email: "staff@gm.ibaraki-ct.ac.jp" },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("WebSocket", TestWebSocket);
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthGuard permission="Staff">
          <Kitchen />
        </AuthGuard>
      </QueryClientProvider>,
    );
    await screen.findByText("このページを閲覧する権限がありません。");
    expect(TestWebSocket.instances).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("通知で他端末の変更を取得し、離脱時に接続を閉じる", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const source = TestWebSocket.instances[0]!;
    hook.setOrders([]);
    act(() => source.change({ orders: 2 }));
    await waitFor(() => expect(hook.result.current.orders.data).toEqual([]));
    hook.unmount();
    expect(source.close).toHaveBeenCalledOnce();
  });
  it("WebSocket切断中もHTTPが使えれば更新を送れる", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    act(() => TestWebSocket.instances[0]!.disconnect());
    act(() =>
      hook.result.current.cooking.update(
        kitchenOrdersFixture[0]!.id,
        kitchenOrdersFixture[0]!.lines[0]!.menuItemId,
        "cooking",
      ),
    );
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(true),
    );
    hook.unmount();
  });
  it("バックグラウンド取得中だけを理由に操作を無効にしない", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const release = hook.holdList();
    act(() => TestWebSocket.instances[0]!.open());
    await waitFor(() => expect(hook.result.current.realtimeConnected).toBe(true));
    expect(hook.result.current.cooking.pendingLines).toEqual([]);
    act(() =>
      hook.result.current.cooking.update(
        kitchenOrdersFixture[0]!.id,
        kitchenOrdersFixture[0]!.lines[0]!.menuItemId,
        "cooking",
      ),
    );
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(true),
    );
    release();
    hook.unmount();
  });
  it("競合時にエラーを返し、最新の注文を取り直す", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    act(() => {
      TestWebSocket.instances[0]!.open();
    });
    await waitFor(() => expect(hook.result.current.realtimeConnected).toBe(true));
    hook.rejectUpdate();
    hook.setOrders(kitchenOrdersFixture.map((order) => ({ ...order, cookingState: "completed" })));
    act(() =>
      hook.result.current.cooking.update(
        kitchenOrdersFixture[0]!.id,
        kitchenOrdersFixture[0]!.lines[0]!.menuItemId,
        "cooking",
      ),
    );
    await waitFor(() => expect(hook.result.current.cooking.error).toContain("状態または権限"));
    await waitFor(() => expect(hook.result.current.orders.data?.[0]?.cookingState).toBe("completed"));
    hook.unmount();
  });
  it("厨房の担当外であるドリンクの更新を送らない", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(3));
    const order = kitchenOrdersFixture[0]!;
    await act(async () => hook.result.current.cooking.update(order.id, order.lines[2]!.menuItemId, "cooking"));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    hook.unmount();
  });

  it("一覧取得のアクセス拒否でキャッシュを隠して更新を止め、再試行で回復する", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
    const socket = TestWebSocket.instances[0]!;
    hook.setListStatus(403);
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "denied", data: undefined }));
    await act(async () => hook.result.current.cooking.update("order-1", "ramen", "cooking"));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    expect(socket.close).toHaveBeenCalled();
    hook.setListStatus(200);
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
    act(() => hook.result.current.cooking.update("order-1", "ramen", "cooking"));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1));
    hook.unmount();
  });

  it.each(["一覧", "照合"] as const)("%sの通信失敗時は表示用データを残して更新を止める", async (source) => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
    if (source === "一覧") {
      hook.setListStatus(500);
      act(() => hook.result.current.retry());
    } else {
      hook.setRevisionStatus(500);
      act(() => TestWebSocket.instances[0]!.disconnect());
    }
    await waitFor(() => expect(hook.result.current.orders.status).toBe("error"));
    expect(hook.result.current.orders.data).toEqual(kitchenOrdersFixture);
    await act(async () => hook.result.current.cooking.update("order-1", "ramen", "cooking"));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    hook.unmount();
  });

  it.each(["注文削除", "明細削除", "取消", "受け渡し"] as const)(
    "最新一覧で%sとなった対象の更新を送らない",
    async (change) => {
      const hook = setup();
      await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
      const order = kitchenOrdersFixture[0]!;
      hook.setOrders(
        change === "注文削除"
          ? []
          : [
              {
                ...order,
                lines: change === "明細削除" ? [] : order.lines,
                cancelledAt: change === "取消" ? "2026-10-24T02:00:00Z" : null,
                handedOffAt: change === "受け渡し" ? "2026-10-24T02:00:00Z" : null,
              },
            ],
      );
      act(() => hook.result.current.retry());
      await waitFor(() => expect(hook.result.current.orders.data).not.toEqual(kitchenOrdersFixture));
      await act(async () => hook.result.current.cooking.update(order.id, "ramen", "cooking"));
      expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
      hook.unmount();
    },
  );

  it.each(["再試行", "同期確認"] as const)("日本時間の日付変更後、%sで当日の一覧へ切り替える", async (trigger) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T14:59:59Z"));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
    hook.fetch.mockClear();
    vi.setSystemTime(new Date("2026-10-24T15:00:01Z"));
    hook.setOrders([]);
    act(() => {
      if (trigger === "再試行") {
        hook.result.current.retry();
      } else {
        TestWebSocket.instances[0]!.change({ orders: 2 });
      }
    });
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "success", data: [] }));
    const urls = hook.fetch.mock.calls.map(([input]) => (input instanceof Request ? input.url : String(input)));
    expect(urls.some((url) => url.endsWith("businessDate=2026-10-25"))).toBe(true);
    if (trigger === "再試行") {
      expect(urls.some((url) => url.endsWith("businessDate=2026-10-24"))).toBe(false);
    }
    hook.unmount();
  });
});
