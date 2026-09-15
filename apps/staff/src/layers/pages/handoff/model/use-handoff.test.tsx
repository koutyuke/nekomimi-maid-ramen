import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { handoffQueries } from "../../../entities/orders";
import { currentBusinessDate } from "../../../shared/lib";
import { AuthGuard } from "../../../widgets/auth-guard";
import { handoffOrdersFixture } from "../testing";
import { useHandoff } from "./use-handoff";

const Handoff = () => {
  useHandoff();
  return null;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestWebSocket.instances = [];
});

const setup = () => {
  let revision = 1;
  let orders = handoffOrdersFixture;
  let conflict = false;
  let listStatus = 200;
  let revisionStatus = 200;
  let updateStatus = 200;
  let hold: Promise<void> | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/staff/orders/revision")) {
      return Response.json({ revision }, { status: revisionStatus });
    }
    if (init?.method?.toUpperCase() === "PATCH") {
      return Response.json({ id: "order-2", menuItemId: "cola", cookingState: "cooking" }, { status: updateStatus });
    }
    if (init?.method?.toUpperCase() === "POST") {
      orders = orders.map((order) =>
        order.id === "order-1" ? { ...order, handedOffAt: "2026-10-24T01:10:00Z" } : order,
      );
      return conflict
        ? Response.json({ code: "handoff_conflict" }, { status: 409 })
        : Response.json({ id: "order-1", handedOffAt: "2026-10-24T01:10:00Z" });
    }
    if (/\/orders\?businessDate=\d{4}-\d{2}-\d{2}$/.test(url)) {
      await hold;
      return Response.json({ orders, revision }, { status: listStatus });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", TestWebSocket);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const hook = renderHook(() => useHandoff(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return {
    ...hook,
    client,
    fetch,
    setOrders: (next: typeof orders) => {
      orders = next;
      revision += 1;
    },
    setListStatus: (status: number) => {
      listStatus = status;
    },
    setRevisionStatus: (status: number) => {
      revisionStatus = status;
    },
    setUpdateStatus: (status: number) => {
      updateStatus = status;
    },
    reject: () => {
      conflict = true;
    },
    hold: () => {
      let release: (() => void) | undefined;
      hold = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => release?.();
    },
  };
};

const connect = async (hook: ReturnType<typeof setup>) => {
  await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(4));
  act(() => {
    TestWebSocket.instances[0]!.open();
  });
  await waitFor(() => expect(hook.result.current.realtimeConnected && !hook.result.current.handoff.pending).toBe(true));
};

describe("SPEC-HAND-001 当日の注文一覧", () => {
  it("日本時間の当日を指定して一覧を取得する", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders.data).toHaveLength(4));
    const businessDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    expect(
      hook.fetch.mock.calls.some(([input]) =>
        (input instanceof Request ? input.url : String(input)).endsWith(`/staff/orders?businessDate=${businessDate}`),
      ),
    ).toBe(true);
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
          <Handoff />
        </AuthGuard>
      </QueryClientProvider>,
    );
    await screen.findByText("このページを閲覧する権限がありません。");
    expect(TestWebSocket.instances).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("SPEC-HAND-002 SPEC-HAND-003 更新の再確認と通信断", () => {
  it("受け渡しの連打と直後のドリンク更新を止め、再取得が終わるまで操作を止める", async () => {
    const hook = setup();
    await connect(hook);
    const release = hook.hold();
    const drinkOrder = handoffOrdersFixture[1]!;
    act(() => {
      hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id);
      hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id);
      hook.result.current.cooking.update(drinkOrder.id, drinkOrder.lines[1]!.menuItemId, "cooking");
    });
    await waitFor(() => expect(hook.result.current.handoff.pending).toBe(true));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    release();
    await waitFor(() => expect(hook.result.current.handoff.pending).toBe(false));
    act(() => hook.result.current.cooking.update(drinkOrder.id, drinkOrder.lines[1]!.menuItemId, "cooking"));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1));
    hook.unmount();
  });
  it("ドリンクの更新中も別の注文は受け渡せ、同じドリンクへの連打は送信しない", async () => {
    const hook = setup();
    await connect(hook);
    const order = handoffOrdersFixture[1]!;
    const release = hook.hold();
    act(() => {
      hook.result.current.cooking.update(order.id, order.lines[1]!.menuItemId, "cooking");
      hook.result.current.cooking.update(order.id, order.lines[1]!.menuItemId, "cooking");
    });
    await waitFor(() =>
      expect(hook.result.current.cooking.pendingLines).toEqual([{ orderId: order.id, menuItemId: "cola" }]),
    );
    expect(hook.result.current.handoff.pending).toBe(false);
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
    act(() => hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1));
    release();
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toEqual([]));
    hook.unmount();
  });
  it("選んだドリンクの識別子と変更先を送る", async () => {
    const hook = setup();
    await connect(hook);
    const order = handoffOrdersFixture[1]!;
    const line = order.lines[1]!;
    act(() => hook.result.current.cooking.update(order.id, line.menuItemId, "cooking"));
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "PATCH")).toBe(true),
    );
    const [url, init] = hook.fetch.mock.calls.find(([, options]) => options?.method?.toUpperCase() === "PATCH")!;
    expect(url instanceof Request ? url.url : String(url)).toContain("/staff/orders/order-2/lines/cola/cooking-state");
    expect(init?.body).toBe(JSON.stringify({ to: "cooking" }));
    hook.unmount();
  });

  it("WebSocketだけの切断では受け渡しを止めない", async () => {
    const hook = setup();
    await connect(hook);
    const source = TestWebSocket.instances[0]!;
    act(() => source.disconnect());
    act(() => hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id));
    await waitFor(() =>
      expect(hook.fetch.mock.calls.some(([, init]) => init?.method?.toUpperCase() === "POST")).toBe(true),
    );
    hook.unmount();
    expect(source.close).toHaveBeenCalledOnce();
  });
  it("競合後は自動再送せず、他端末が記録した受け渡し日時を取得する", async () => {
    const hook = setup();
    await connect(hook);
    hook.reject();
    act(() => hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id));
    await waitFor(() => expect(hook.result.current.handoff.error).toContain("状態または権限"));
    await waitFor(() => expect(hook.result.current.orders.data?.[0]?.handedOffAt).toBe("2026-10-24T01:10:00Z"));
    act(() => hook.result.current.handoff.complete(handoffOrdersFixture[0]!.id));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method?.toUpperCase() === "POST")).toHaveLength(1);
    hook.unmount();
  });
});

describe("SPEC-HAND-001 SPEC-HAND-002 SPEC-HAND-003 操作条件と回復", () => {
  it("初回取得中はドリンク更新も受け渡しも送らない", async () => {
    const hook = setup();
    expect(hook.result.current.orders).toEqual({ status: "pending", data: undefined });
    await act(async () => {
      hook.result.current.cooking.update("order-2", "cola", "cooking");
      hook.result.current.handoff.complete("order-1");
    });
    expect(hook.fetch.mock.calls.filter(([, init]) => ["PATCH", "POST"].includes(init?.method ?? ""))).toHaveLength(0);
    hook.unmount();
  });

  it.each(["一覧", "照合"] as const)("%sのアクセス拒否でデータを隠し、再試行で回復する", async (source) => {
    const hook = setup();
    await connect(hook);
    if (source === "一覧") {
      hook.setListStatus(403);
      act(() => hook.result.current.retry());
    } else {
      hook.setRevisionStatus(403);
      act(() => TestWebSocket.instances[0]!.disconnect());
    }
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "denied", data: undefined }));
    await act(async () => {
      hook.result.current.cooking.update("order-2", "cola", "cooking");
      hook.result.current.handoff.complete("order-1");
    });
    expect(hook.fetch.mock.calls.filter(([, init]) => ["PATCH", "POST"].includes(init?.method ?? ""))).toHaveLength(0);
    hook.setListStatus(200);
    hook.setRevisionStatus(200);
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.orders.status).toBe("success"));
    act(() => hook.result.current.handoff.complete("order-1"));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1));
    hook.unmount();
  });

  it.each(["一覧", "照合"] as const)("%sの失敗時はデータを残し、両方の更新を止める", async (source) => {
    const hook = setup();
    await connect(hook);
    if (source === "一覧") {
      hook.setListStatus(500);
      act(() => hook.result.current.retry());
    } else {
      hook.setRevisionStatus(500);
      act(() => TestWebSocket.instances[0]!.disconnect());
    }
    await waitFor(() => expect(hook.result.current.orders).toEqual({ status: "error", data: handoffOrdersFixture }));
    await act(async () => {
      hook.result.current.cooking.update("order-2", "cola", "cooking");
      hook.result.current.handoff.complete("order-1");
    });
    expect(hook.fetch.mock.calls.filter(([, init]) => ["PATCH", "POST"].includes(init?.method ?? ""))).toHaveLength(0);
    hook.unmount();
  });

  it.each(["注文削除", "明細削除", "取消", "受け渡し"] as const)(
    "最新一覧で%sになった注文の操作を送らない",
    async (change) => {
      const hook = setup();
      await connect(hook);
      const order = handoffOrdersFixture[0]!;
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
      act(() => TestWebSocket.instances[0]!.change({ orders: 2 }));
      await waitFor(() => expect(hook.result.current.orders.data).not.toEqual(handoffOrdersFixture));
      await act(async () => {
        hook.result.current.cooking.update(order.id, "tea", "cooking");
        hook.result.current.handoff.complete(order.id);
      });
      expect(hook.fetch.mock.calls.filter(([, init]) => ["PATCH", "POST"].includes(init?.method ?? ""))).toHaveLength(
        0,
      );
      hook.unmount();
    },
  );

  it("未完成の注文の受け渡しとドリンク以外の更新を送らない", async () => {
    const hook = setup();
    await connect(hook);
    await act(async () => {
      hook.result.current.handoff.complete("order-2");
      hook.result.current.cooking.update("order-2", "ramen", "cooking");
      hook.result.current.cooking.update("order-3", "gyoza", "cooking");
    });
    expect(hook.fetch.mock.calls.filter(([, init]) => ["PATCH", "POST"].includes(init?.method ?? ""))).toHaveLength(0);
    hook.unmount();
  });

  it("対象注文のドリンク更新後、完成した一覧を取得しても更新処理が終わるまで受け渡せない", async () => {
    const hook = setup();
    await connect(hook);
    const order = handoffOrdersFixture[1]!;
    const release = hook.hold();
    act(() => hook.result.current.cooking.update(order.id, "cola", "cooking"));
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toHaveLength(1));
    act(() => {
      hook.client.setQueryData(handoffQueries.list(currentBusinessDate()).queryKey, {
        data: [
          {
            ...order,
            cookingState: "completed",
            lines: order.lines.map((line) => Object.assign({}, line, { cookingState: "completed" as const })),
          },
        ],
        revision: 2,
      });
    });
    await waitFor(() => expect(hook.result.current.orders.data?.[0]?.cookingState).toBe("completed"));
    act(() => hook.result.current.handoff.complete(order.id));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    release();
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toHaveLength(0));
    hook.unmount();
  });

  it("ドリンクのエラーが残っていても受け渡しのエラーを取得でき、失敗後も別の操作を行える", async () => {
    const hook = setup();
    await connect(hook);
    hook.setUpdateStatus(409);
    act(() => hook.result.current.cooking.update("order-2", "cola", "cooking"));
    await waitFor(() => expect(hook.result.current.cooking.pendingLines).toHaveLength(0));
    await waitFor(() => expect(hook.result.current.cooking.error).toContain("商品の状態"));
    hook.reject();
    act(() => hook.result.current.handoff.complete("order-1"));
    await waitFor(() => expect(hook.result.current.handoff.error).toContain("注文の状態"));
    await waitFor(() => expect(hook.result.current.handoff.pending).toBe(false));
    expect(hook.result.current.cooking.error).toContain("商品の状態");
    hook.setUpdateStatus(200);
    act(() => hook.result.current.cooking.update("order-2", "cola", "cooking"));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(2));
    await waitFor(() => expect(hook.result.current.cooking.error).toBeNull());
    expect(hook.result.current.handoff.error).toContain("注文の状態");
    hook.unmount();
  });

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
