import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { MenuItemId } from "../../../../core/domain/ids";
import { Price } from "../../../../core/domain/money";
import { businessDateAt, LineQuantity, OrderLine, totalAmountOf } from "../order";

const line = (menuItemId: string, quantity: number, unitPrice: number) =>
  new OrderLine({
    menuItemId: MenuItemId.make(menuItemId),
    quantity: LineQuantity.make(quantity),
    unitPrice: Price.make(unitPrice),
  });

describe("SPEC-HAND-001 注文番号を数える営業日", () => {
  it("日本時間の日付を営業日とする", () => {
    expect(businessDateAt(new Date("2026-11-01T03:00:00.000Z"))).toBe("2026-11-01");
  });

  it("日本時間で日付が変わる時刻を境に営業日を切り替える", () => {
    expect(businessDateAt(new Date("2026-11-01T14:59:59.999Z"))).toBe("2026-11-01");
    expect(businessDateAt(new Date("2026-11-01T15:00:00.000Z"))).toBe("2026-11-02");
  });
});

describe("SPEC-SAL-003 合計金額の算出", () => {
  it("商品ごとの価格と個数の積を合計する", () => {
    expect(totalAmountOf([line("item-ramen", 2, 500), line("item-gyoza", 3, 400)])).toBe(2200);
  });

  it("商品がない注文の合計金額を0とする", () => {
    expect(totalAmountOf([])).toBe(0);
  });
});

describe("SPEC-SAL-001 個数の範囲", () => {
  it.each([0, 11, 1.5, -1])("%s個を受け付けない", (quantity) => {
    expect(Schema.decodeUnknownEither(LineQuantity)(quantity)._tag).toBe("Left");
  });

  it.each([1, 10])("%s個を受け付ける", (quantity) => {
    expect(Schema.decodeUnknownEither(LineQuantity)(quantity)._tag).toBe("Right");
  });
});
