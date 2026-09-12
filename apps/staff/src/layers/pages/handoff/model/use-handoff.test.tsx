import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { TestWebSocket } from "../../../../testing/websocket";
import { handoffPageFixture } from "../testing";
import { useHandoff } from "./use-handoff";

afterEach(() => {
  vi.unstubAllGlobals();
  TestWebSocket.instances = [];
});

const setup = (role = "Staff") => {
  let revision = 1;
  let orders = handoffPageFixture.orders;
  let conflict = false;
  let hold: Promise<void> | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/staff/orders/revision")) {
      return Response.json({ revision });
    }
    if (url.endsWith("/auth/session")) {
      return Response.json({ staff: { id: "staff-1", role, name: "担当者", email: "staff@example.com" } });
    }
    if (init?.method?.toUpperCase() === "PATCH") {
      return Response.json({ id: "order-2", menuItemId: "cola", cookingState: "cooking" });
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
      return Response.json({ orders, revision });
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
    fetch,
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
  await waitFor(() => expect(hook.result.current.orders).toHaveLength(4));
  act(() => {
    TestWebSocket.instances[0]!.open();
  });
  await waitFor(() => expect(hook.result.current.connected && !hook.result.current.pending).toBe(true));
};

describe("SPEC-HAND-001 当日の注文一覧", () => {
  it("日本時間の当日を指定して一覧を取得する", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.orders).toHaveLength(4));
    const businessDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    expect(
      hook.fetch.mock.calls.some(([input]) =>
        (input instanceof Request ? input.url : String(input)).endsWith(`/staff/orders?businessDate=${businessDate}`),
      ),
    ).toBe(true);
    hook.unmount();
  });

  it("権限がなければ一覧取得も通知接続も始めない", async () => {
    const hook = setup("None");
    await waitFor(() => expect(hook.result.current.access).toBe("denied"));
    expect(TestWebSocket.instances).toHaveLength(0);
    expect(hook.fetch).toHaveBeenCalledTimes(1);
    hook.unmount();
  });
});

describe("SPEC-HAND-002 SPEC-HAND-003 更新の再確認と通信断", () => {
  it("ドリンクの更新中も別の注文は受け渡せ、同じドリンクへの連打は送信しない", async () => {
    const hook = setup();
    await connect(hook);
    const order = handoffPageFixture.orders[1]!;
    const release = hook.hold();
    act(() => {
      hook.result.current.actions.onUpdate(order, order.lines[1]!, "cooking");
      hook.result.current.actions.onUpdate(order, order.lines[1]!, "cooking");
    });
    await waitFor(() => expect(hook.result.current.pendingLines).toEqual([{ orderId: order.id, menuItemId: "cola" }]));
    expect(hook.result.current.pending).toBe(false);
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
    act(() => hook.result.current.actions.onComplete(handoffPageFixture.orders[0]!));
    await waitFor(() => expect(hook.fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1));
    release();
    await waitFor(() => expect(hook.result.current.pendingLines).toEqual([]));
    hook.unmount();
  });
  it("選んだドリンクの識別子と変更先を送る", async () => {
    const hook = setup();
    await connect(hook);
    const order = handoffPageFixture.orders[1]!;
    const line = order.lines[1]!;
    act(() => hook.result.current.actions.onUpdate(order, line, "cooking"));
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
    act(() => hook.result.current.actions.onComplete(handoffPageFixture.orders[0]!));
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
    act(() => hook.result.current.actions.onComplete(handoffPageFixture.orders[0]!));
    await waitFor(() => expect(hook.result.current.error).toContain("状態または権限"));
    await waitFor(() => expect(hook.result.current.orders[0]?.handedOffAt).toBe("2026-10-24T01:10:00Z"));
    act(() => hook.result.current.actions.onComplete(handoffPageFixture.orders[0]!));
    expect(hook.fetch.mock.calls.filter(([, init]) => init?.method?.toUpperCase() === "POST")).toHaveLength(1);
    hook.unmount();
  });
});
