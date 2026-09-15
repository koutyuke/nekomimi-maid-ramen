import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { menuFixture } from "../../../entities/menu/testing";
import { confirmOrder } from "../api/confirm-order";
import { receiptFixture } from "../testing";
import { useConfirmOrder } from "./use-confirm-order";
import type { Confirmation } from "../api/confirm-order";

vi.mock("../api/confirm-order", () => ({ confirmOrder: vi.fn() }));

const open = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useConfirmOrder(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

const item = menuFixture.find((candidate) => candidate.id === "item-ramen")!;

beforeEach(() => {
  vi.mocked(confirmOrder).mockReset();
});

describe("SPEC-SAL-003〜005 注文確定の再送", () => {
  it("受取金額が未入力なら送信せず、入力後に確定できる", async () => {
    vi.mocked(confirmOrder).mockResolvedValue({ kind: "confirmed", order: receiptFixture.order });
    const { result } = open();
    const lines = [{ item, quantity: "2" }];
    await act(() => result.current.submit(lines, null));
    expect(confirmOrder).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("idle");
    await act(() => result.current.submit(lines, 2000));
    expect(confirmOrder).toHaveBeenCalledTimes(1);
    expect(result.current.previousOrder).toEqual(receiptFixture);
  });

  it("結果不明の再送が拒否されても、最初の要求と精算情報を保つ", async () => {
    vi.mocked(confirmOrder)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ kind: "rejected", message: "ログイン状態とスタッフ権限を確認してください。" })
      .mockResolvedValueOnce({ kind: "confirmed", order: receiptFixture.order });
    const { result } = open();
    await act(() => result.current.submit([{ item, quantity: "2" }], 2000));
    expect(result.current.state.status).toBe("uncertain");
    act(() => result.current.reset());
    await act(() =>
      result.current.submit([{ item: { ...item, name: "変更後の商品名", price: 1200 }, quantity: "1" }], 5000),
    );
    expect(confirmOrder).toHaveBeenCalledTimes(1);
    await act(() => result.current.retry());
    expect(result.current.state).toMatchObject({
      status: "uncertain",
      rejection: { kind: "rejected", message: "ログイン状態とスタッフ権限を確認してください。" },
    });
    expect(result.current.locked).toBe(true);
    const warning = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(warning);
    expect(warning.defaultPrevented).toBe(true);
    await act(() => result.current.retry());
    expect(confirmOrder).toHaveBeenCalledTimes(3);
    expect(vi.mocked(confirmOrder).mock.calls[1]).toEqual(vi.mocked(confirmOrder).mock.calls[0]);
    expect(vi.mocked(confirmOrder).mock.calls[2]).toEqual(vi.mocked(confirmOrder).mock.calls[0]);
    expect(result.current.previousOrder).toEqual({
      order: receiptFixture.order,
      names: { [item.id]: item.name },
      received: 2000,
      quotedTotal: item.price * 2,
    });
    expect(result.current.state.status).toBe("confirmed");
    const afterConfirmation = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(afterConfirmation);
    expect(afterConfirmation.defaultPrevented).toBe(false);
  });

  it("送信開始直後の連打とリセットを防ぎ、次の注文でも前回の履歴を残す", async () => {
    let release!: (response: Confirmation) => void;
    vi.mocked(confirmOrder).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const { result } = open();
    const lines = [{ item, quantity: "2" }];
    let submission!: Promise<void>;
    act(() => {
      submission = result.current.submit(lines, 2000);
      expect(result.current.isLocked()).toBe(true);
      void result.current.submit(lines, 2000);
      result.current.reset();
    });
    expect(confirmOrder).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe("pending");
    await act(async () => {
      release({ kind: "confirmed", order: receiptFixture.order });
      await submission;
    });
    await act(() => result.current.submit(lines, 2000));
    await act(() => result.current.retry());
    expect(confirmOrder).toHaveBeenCalledTimes(1);
    act(() => result.current.reset());
    expect(result.current.state.status).toBe("idle");
    expect(result.current.previousOrder).toEqual(receiptFixture);
    expect(result.current.locked).toBe(false);
    vi.mocked(confirmOrder).mockRejectedValueOnce(new Error("offline"));
    await act(() => result.current.submit(lines, 2000));
    expect(result.current.previousOrder).toEqual(receiptFixture);
    expect(vi.mocked(confirmOrder).mock.calls[1]![0].requestId).not.toBe(
      vi.mocked(confirmOrder).mock.calls[0]![0].requestId,
    );
  });

  it.each([
    {
      kind: "rejected",
      message: "他の操作と競合したため注文を確定できませんでした。商品情報を確認して、もう一度確定してください。",
    },
    { kind: "shortage", shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }] },
  ] satisfies Confirmation[])("初回の$kind後は入力を修正して新しい要求を送れる", async (response) => {
    vi.mocked(confirmOrder)
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ kind: "confirmed", order: receiptFixture.order });
    const { result } = open();
    await act(() => result.current.submit([{ item, quantity: "2" }], 2000));
    expect(result.current.state).toEqual({ status: "failed", result: response });
    expect(result.current.locked).toBe(false);
    await act(() => result.current.retry());
    expect(confirmOrder).toHaveBeenCalledTimes(1);
    await act(() => result.current.submit([{ item, quantity: "1" }], 1000));
    const [first, second] = vi.mocked(confirmOrder).mock.calls;
    expect(second![0].requestId).not.toBe(first![0].requestId);
    expect(second![0].lines).toEqual([{ menuItemId: item.id, quantity: 1 }]);
  });
});
