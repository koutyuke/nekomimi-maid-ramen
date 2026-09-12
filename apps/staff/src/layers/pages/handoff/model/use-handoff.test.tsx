import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { handoffPageFixture } from "../testing";
import { useHandoff } from "./use-handoff";

class TestEventSource extends EventTarget {
  static instances: TestEventSource[] = [];
  close = vi.fn();
  constructor() {
    super();
    TestEventSource.instances.push(this);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  TestEventSource.instances = [];
});

const setup = (role = "Staff") => {
  let orders = handoffPageFixture.orders;
  let conflict = false;
  let hold: Promise<void> | undefined;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
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
      return Response.json({ orders });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("EventSource", TestEventSource);
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
    TestEventSource.instances[0]!.dispatchEvent(new Event("refresh"));
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
        (input instanceof Request ? input.url : String(input)).endsWith(`/orders?businessDate=${businessDate}`),
      ),
    ).toBe(true);
    hook.unmount();
  });

  it("権限がなければ一覧取得も通知接続も始めない", async () => {
    const hook = setup("None");
    await waitFor(() => expect(hook.result.current.access).toBe("denied"));
    expect(TestEventSource.instances).toHaveLength(0);
    expect(hook.fetch).toHaveBeenCalledTimes(1);
    hook.unmount();
  });
});

describe("SPEC-HAND-002 SPEC-HAND-003 更新の再確認と通信断", () => {
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
    expect(url instanceof Request ? url.url : String(url)).toContain("/orders/order-2/lines/cola/cooking-state");
    expect(init?.body).toBe(JSON.stringify({ to: "cooking" }));
    hook.unmount();
  });

  it("切断中と再接続後の取得中は更新を送らない", async () => {
    const hook = setup();
    await connect(hook);
    const source = TestEventSource.instances[0]!;
    act(() => {
      source.dispatchEvent(new Event("error"));
    });
    act(() => hook.result.current.actions.onComplete(handoffPageFixture.orders[0]!));
    const release = hook.hold();
    act(() => {
      source.dispatchEvent(new Event("refresh"));
    });
    await waitFor(() => expect(hook.result.current.pending).toBe(true));
    act(() =>
      hook.result.current.actions.onUpdate(
        handoffPageFixture.orders[1]!,
        handoffPageFixture.orders[1]!.lines[1]!,
        "cooking",
      ),
    );
    expect(
      hook.fetch.mock.calls.some(([, init]) => ["POST", "PATCH"].includes(init?.method?.toUpperCase() ?? "")),
    ).toBe(false);
    release();
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
