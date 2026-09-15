import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { TestWebSocket } from "../../../../testing/websocket";
import { menuQueryScopes } from "../../../entities/menu";
import { handoffQueryScopes, kitchenQueryScopes, ordersQueries } from "../../../entities/orders";
import { staffQueries } from "../../../entities/staff";
import { useOrderManagement } from "./use-order-management";
import type { Order } from "../../../entities/orders";

const order: Order = {
  id: "order-1",
  businessDate: "2026-10-24",
  orderNumber: 12,
  confirmedAt: "2026-10-24T01:00:00Z",
  cookingState: "cooking",
  handedOffAt: null,
  cancelledAt: null,
  lines: [{ menuItemId: "ramen", name: "ラーメン", category: "main", quantity: 2, cookingState: "cooking" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestWebSocket.instances = [];
});

const setup = () => {
  const server = {
    orders: [order] as readonly Order[],
    revision: 1,
    listStatus: 200,
    revisionStatus: 200,
    cancelStatus: 200,
    lostResponse: false,
    hold: undefined as Promise<void> | undefined,
  };
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/staff/orders/revision")) {
      return Response.json({ revision: server.revision }, { status: server.revisionStatus });
    }
    if (url.endsWith("/staff/orders/order-1/cancel") && init?.method === "POST") {
      if (server.cancelStatus === 200 || server.cancelStatus === 409) {
        server.orders = [{ ...order, cancelledAt: "2026-10-24T02:00:00Z" }];
        server.revision += 1;
      }
      if (server.lostResponse) {
        throw new TypeError("Failed to fetch");
      }
      return Response.json({ id: order.id }, { status: server.cancelStatus });
    }
    if (url.includes("/staff/orders?")) {
      await server.hold;
      return Response.json({ orders: server.orders, revision: server.revision }, { status: server.listStatus });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", TestWebSocket);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const hook = renderHook(() => useOrderManagement(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return {
    ...hook,
    server,
    client,
    fetch,
    posts: () => fetch.mock.calls.filter(([, init]) => init?.method === "POST"),
  };
};

const ready = async (hook: ReturnType<typeof setup>) => {
  await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
  act(() => TestWebSocket.instances.at(-1)!.open());
  await waitFor(() => expect(hook.result.current.realtimeConnected).toBe(true));
};

describe("SPEC-SAL-006 注文管理の取得と取消", () => {
  it("初回取得中は取消を送らない", async () => {
    const hook = setup();
    expect(hook.result.current.orders).toEqual({ status: "pending", data: undefined });
    await act(async () => hook.result.current.cancellation.cancel(order.id));
    expect(hook.posts()).toHaveLength(0);
    hook.unmount();
  });

  it("営業日は日本時間の当日で始まり、選択後は日付をまたいで再試行しても変更しない", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    const hook = setup();
    await ready(hook);
    expect(hook.result.current.businessDate).toBe("2026-10-25");
    act(() => hook.result.current.changeBusinessDate("2026-10-23"));
    await ready(hook);
    hook.fetch.mockClear();
    vi.setSystemTime(new Date("2026-10-25T15:00:00Z"));
    act(() => {
      hook.result.current.changeBusinessDate("");
      hook.result.current.retry();
    });
    await ready(hook);
    expect(hook.result.current.businessDate).toBe("2026-10-23");
    const urls = hook.fetch.mock.calls.map(([input]) => (input instanceof Request ? input.url : String(input)));
    expect(urls.some((url) => url.includes("businessDate=2026-10-23&includeCancelled=true"))).toBe(true);
    expect(urls.some((url) => url.includes("businessDate=2026-10-26"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/auth/session"))).toBe(false);
    hook.unmount();
  });

  it("連打と日付変更を止め、関連一覧の再取得まで取消処理を継続する", async () => {
    const hook = setup();
    await ready(hook);
    const date = hook.result.current.businessDate;
    const scopes = [menuQueryScopes.all(), kitchenQueryScopes.all(), handoffQueryScopes.all()];
    for (const key of scopes) {
      hook.client.setQueryData(key, {});
    }
    let release: (() => void) | undefined;
    hook.server.hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    act(() => {
      hook.result.current.cancellation.cancel(order.id);
      hook.result.current.cancellation.cancel(order.id);
      hook.result.current.changeBusinessDate("2026-10-23");
    });
    await waitFor(() => expect(hook.posts()).toHaveLength(1));
    await waitFor(() => expect(hook.client.getQueryState(scopes[0]!)?.isInvalidated).toBe(true));
    expect(hook.result.current.cancellation.pending).toBe(true);
    expect(hook.result.current.businessDate).toBe(date);
    act(() => hook.result.current.cancellation.cancel(order.id));
    expect(hook.posts()).toHaveLength(1);
    release?.();
    await waitFor(() => expect(hook.result.current.cancellation.cancelledOrderNumber).toBe(12));
    expect(hook.result.current.cancellation.pending).toBe(false);
    expect(hook.result.current.orders.data?.[0]?.cancelledAt).toBe("2026-10-24T02:00:00Z");
    for (const key of scopes) {
      expect(hook.client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    act(() => hook.result.current.changeBusinessDate("2026-10-23"));
    expect(hook.result.current.cancellation.cancelledOrderNumber).toBeNull();
    hook.unmount();
  });

  it.each(["一覧", "照合"] as const)("%sの拒否でデータと取消を止め、再試行で回復する", async (source) => {
    const hook = setup();
    await ready(hook);
    if (source === "一覧") {
      hook.server.listStatus = 403;
      act(() => hook.result.current.retry());
    } else {
      hook.server.revisionStatus = 403;
      act(() => TestWebSocket.instances.at(-1)!.disconnect());
    }
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "denied", data: undefined }));
    act(() => hook.result.current.cancellation.cancel(order.id));
    expect(hook.posts()).toHaveLength(0);
    hook.server.listStatus = 200;
    hook.server.revisionStatus = 200;
    act(() => hook.result.current.retry());
    await ready(hook);
    act(() => hook.result.current.cancellation.cancel(order.id));
    await waitFor(() => expect(hook.posts()).toHaveLength(1));
    hook.unmount();
  });

  it.each(["一覧", "照合"] as const)("%sの失敗では取得済みの注文を残し、取消を止める", async (source) => {
    const hook = setup();
    await ready(hook);
    if (source === "一覧") {
      hook.server.listStatus = 500;
      act(() => hook.result.current.retry());
    } else {
      hook.server.revisionStatus = 500;
      act(() => TestWebSocket.instances.at(-1)!.disconnect());
    }
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "error", data: [order] }));
    act(() => hook.result.current.cancellation.cancel(order.id));
    expect(hook.posts()).toHaveLength(0);
    hook.unmount();
  });

  it.each(["削除", "取消済み", "受け渡し済み", "完成明細あり"] as const)(
    "現在の一覧で%sの注文を取り消さない",
    async (state) => {
      const hook = setup();
      await ready(hook);
      const updated: Order = {
        ...order,
        cancelledAt: state === "取消済み" ? "2026-10-24T02:00:00Z" : null,
        handedOffAt: state === "受け渡し済み" ? "2026-10-24T02:00:00Z" : null,
        lines:
          state === "完成明細あり"
            ? [
                ...order.lines,
                { menuItemId: "tea", name: "お茶", category: "drink", quantity: 1, cookingState: "completed" },
              ]
            : order.lines,
      };
      act(() => {
        hook.client.setQueryData(ordersQueries.list(hook.result.current.businessDate).queryKey, {
          data: state === "削除" ? [] : [updated],
          revision: 2,
        });
      });
      await waitFor(() => expect(hook.result.current.orders.data).not.toEqual([order]));
      act(() => hook.result.current.cancellation.cancel(order.id));
      expect(hook.posts()).toHaveLength(0);
      hook.unmount();
    },
  );

  it.each(["競合", "応答消失"] as const)("%sでも自動再送せず、一覧で取消結果を確認する", async (failure) => {
    const hook = setup();
    await ready(hook);
    hook.server.cancelStatus = failure === "競合" ? 409 : 200;
    hook.server.lostResponse = failure === "応答消失";
    act(() => hook.result.current.cancellation.cancel(order.id));
    await waitFor(() =>
      expect(hook.result.current.cancellation.error).toContain(
        failure === "競合" ? "状態または権限" : "重ねて返金しない",
      ),
    );
    await waitFor(() => expect(hook.result.current.cancellation.pending).toBe(false));
    expect(hook.result.current.orders.data?.[0]?.cancelledAt).toBe("2026-10-24T02:00:00Z");
    expect(hook.result.current.cancellation.cancelledOrderNumber).toBeNull();
    act(() => hook.result.current.cancellation.cancel(order.id));
    expect(hook.posts()).toHaveLength(1);
    act(() => hook.result.current.changeBusinessDate("2026-10-23"));
    expect(hook.result.current.cancellation.error).toBeNull();
    expect(hook.result.current.businessDate).toBe("2026-10-23");
    hook.unmount();
  });

  it("WebSocketだけの切断では取消を止めない", async () => {
    const hook = setup();
    await ready(hook);
    act(() => TestWebSocket.instances.at(-1)!.disconnect());
    act(() => hook.result.current.cancellation.cancel(order.id));
    await waitFor(() => expect(hook.posts()).toHaveLength(1));
    hook.unmount();
  });

  it.each([401, 403])("取消APIの%sでは認証を再確認し、再送しない", async (status) => {
    const hook = setup();
    await ready(hook);
    const key = staffQueries.current().queryKey;
    hook.client.setQueryData(key, () => ({
      id: "staff-1",
      role: "Staff" as const,
      name: "担当者",
      email: "staff@gm.ibaraki-ct.ac.jp",
    }));
    hook.server.cancelStatus = status;
    act(() => hook.result.current.cancellation.cancel(order.id));
    await waitFor(() => expect(hook.result.current.cancellation.error).toContain("権限がありません"));
    await waitFor(() => expect(hook.result.current.cancellation.pending).toBe(false));
    expect(hook.client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(hook.posts()).toHaveLength(1);
    hook.unmount();
  });
});
