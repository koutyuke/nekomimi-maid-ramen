import { describe, expect, it } from "vitest";

import { allergenFixture, menuItemFixture } from "../../../features/visitor-information/testing";
import { presentMenu } from "../menu.response";

describe("SPEC-VIS-004 特定原材料の確認状態", () => {
  it("未確認の商品と、含まれないことを確認した商品を区別できる", () => {
    // どちらも品目一覧は空になる。一覧の空だけで判断すると、未確認の商品について
    // 含まれない旨を表示してしまう。
    const response = presentMenu([
      {
        menuItem: menuItemFixture({
          id: "item-unchecked",
          name: "ラーメン",
          price: 500,
          displayOrder: 1,
          allergenCheckState: "unchecked",
        }),
        sellable: true,
      },
      {
        menuItem: menuItemFixture({
          id: "item-checked",
          name: "コーラ",
          price: 300,
          displayOrder: 2,
          allergenCheckState: "checked",
        }),
        sellable: true,
      },
    ]);

    expect(response.items.map((item) => [item.id, item.allergenCheckState, item.containedAllergens.length])).toEqual([
      ["item-unchecked", "unchecked", 0],
      ["item-checked", "checked", 0],
    ]);
  });

  it("含まれると確認した品目を残す", () => {
    const response = presentMenu([
      {
        menuItem: menuItemFixture({
          id: "item-gyoza",
          name: "餃子",
          price: 400,
          displayOrder: 1,
          allergenCheckState: "checked",
          containedAllergens: [allergenFixture("allergen-wheat", "小麦"), allergenFixture("allergen-egg", "卵")],
        }),
        sellable: true,
      },
    ]);

    expect(response.items[0]?.containedAllergens.map((allergen) => allergen.name)).toEqual(["小麦", "卵"]);
  });
});

describe("SPEC-VIS-002 メニューの応答", () => {
  it("説明が未記入の商品をnullとして表す", () => {
    const response = presentMenu([
      {
        menuItem: menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 }),
        sellable: true,
      },
      {
        menuItem: menuItemFixture({
          id: "item-gyoza",
          name: "餃子",
          price: 400,
          displayOrder: 2,
          description: "自家製の皮",
        }),
        sellable: true,
      },
    ]);

    expect(response.items.map((item) => item.description)).toEqual([null, "自家製の皮"]);
  });
});
