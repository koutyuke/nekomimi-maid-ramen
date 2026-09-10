import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { menuFixture } from "../../../entities/menu/testing";
import { confirmOrder } from "../api/confirm-order";
import { receiptFixture } from "../testing";
import { useConfirmOrder } from "./use-confirm-order";

vi.mock("../api/confirm-order", () => ({ confirmOrder: vi.fn() }));

describe("SPEC-SAL-003〜005 注文確定の再送", () => {
  it("再送時に別の入力が渡されても、最初の要求と精算情報を使う", async () => {
    vi.mocked(confirmOrder)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ kind: "confirmed", order: receiptFixture.order });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useConfirmOrder(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    const item = menuFixture.find((candidate) => candidate.id === "item-ramen")!;
    await act(() => result.current.submit([{ item, quantity: "2" }], "2000"));
    expect(result.current.uncertain).toBe(true);
    await act(() =>
      result.current.submit([{ item: { ...item, name: "変更後の商品名", price: 1200 }, quantity: "1" }], "5000"),
    );
    expect(confirmOrder).toHaveBeenCalledTimes(2);
    expect(vi.mocked(confirmOrder).mock.calls[1]).toEqual(vi.mocked(confirmOrder).mock.calls[0]);
    expect(result.current.previousOrder).toEqual({
      order: receiptFixture.order,
      names: { [item.id]: item.name },
      received: 2000,
      quotedTotal: item.price * 2,
    });
    expect(result.current.uncertain).toBe(false);
  });
});
