import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { menuFixture } from "../../../entities/menu/testing";
import { useOrderDraft } from "./use-order-draft";

describe("SPEC-SAL-003〜004 / SPEC-INV-001 注文候補の会計と在庫判定", () => {
  it("在庫と価格の更新から表示金額と確定可否を導出し、入力を保持する", () => {
    const item = menuFixture.find((candidate) => candidate.id === "item-ramen")!;
    const { result, rerender } = renderHook(({ items }) => useOrderDraft(items, false), {
      initialProps: { items: [item] },
    });
    act(() => {
      result.current.changeQuantity(item, 1);
      result.current.changeQuantity(item, 1);
      result.current.changeReceived(1000);
    });
    expect(result.current.checkout).toEqual({ total: 1000, change: 0 });
    expect(result.current.shortages).toEqual([]);
    expect(result.current.isValid).toBe(true);

    rerender({ items: [{ ...item, quantity: 1 }] });
    expect(result.current.shortages).toEqual([{ menuItemId: item.id, name: item.name, requested: 2, available: 1 }]);
    expect(result.current.isValid).toBe(false);
    expect(result.current.values.lines[0]?.quantity).toBe("2");
    expect(result.current.values.received).toBe(1000);

    rerender({ items: [{ ...item, price: 600 }] });
    expect(result.current.shortages).toEqual([]);
    expect(result.current.checkout).toEqual({ total: 1200, change: null });
    expect(result.current.isValid).toBe(false);
  });

  it("未入力と0円を区別し、100円単位の安全な整数だけを保持する", () => {
    const { result } = renderHook(() => useOrderDraft(menuFixture, false));
    expect(result.current.values.received).toBeNull();
    act(() => result.current.changeReceived(0));
    expect(result.current.values.received).toBe(0);
    act(() => result.current.changeReceived(1000));
    for (const invalid of [-100, 1, 100.5, NaN, Infinity, 9_007_199_254_741_000]) {
      act(() => result.current.changeReceived(invalid));
      expect(result.current.values.received).toBe(1000);
    }
    act(() => result.current.changeReceived(null));
    expect(result.current.values.received).toBeNull();
    act(() => result.current.changeReceived(500));
    act(() => {
      expect(result.current.capture().received).toBe(500);
    });
    act(() => result.current.reset());
    expect(result.current.values.received).toBeNull();
  });
});
