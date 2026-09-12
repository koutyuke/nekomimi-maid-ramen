import { describe, expect, it } from "vitest";

import { MenuItemId } from "../../../../core/domain/ids";
import { stockFixture } from "../../testing";
import { shortagesFor } from "../stock";

const demand = (menuItemId: string, quantity: number) => ({ menuItemId: MenuItemId.make(menuItemId), quantity });

describe("SPEC-INV-002 在庫と注文数の突き合わせ", () => {
  it("在庫が要求数以上の商品を不足として挙げない", () => {
    const shortages = shortagesFor([stockFixture("item-ramen", 3)], [demand("item-ramen", 3)]);

    expect(shortages).toEqual([]);
  });

  it("在庫が要求数に満たない商品を要求数と残数付きで挙げる", () => {
    const shortages = shortagesFor([stockFixture("item-ramen", 1)], [demand("item-ramen", 2)]);

    expect(shortages).toEqual([{ menuItemId: "item-ramen", requested: 2, available: 1 }]);
  });

  it("在庫の記録がない商品を残数0の不足として挙げる", () => {
    const shortages = shortagesFor([], [demand("item-gyoza", 1)]);

    expect(shortages).toEqual([{ menuItemId: "item-gyoza", requested: 1, available: 0 }]);
  });

  it("不足する商品だけを挙げる", () => {
    const shortages = shortagesFor(
      [stockFixture("item-ramen", 5), stockFixture("item-gyoza", 0)],
      [demand("item-ramen", 2), demand("item-gyoza", 1)],
    );

    expect(shortages.map((shortage) => shortage.menuItemId)).toEqual(["item-gyoza"]);
  });
});
