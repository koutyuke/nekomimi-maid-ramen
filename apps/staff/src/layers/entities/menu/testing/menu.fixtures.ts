import type { MenuItem } from "../model/menu";

export const menuItemFixture = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: "item-ramen",
  name: "ラーメン",
  description: "鶏がらと醤油のラーメン",
  price: 500,
  category: "main",
  sellable: true,
  allergenCheckState: "unchecked",
  containedAllergens: [],
  ...overrides,
});

// 原材料の確認状態と販売可否を出し分ける表示を確かめるため、状態の異なる商品を混ぜる。
export const menuFixture: readonly MenuItem[] = [
  menuItemFixture({
    allergenCheckState: "checked",
    containedAllergens: [
      { id: "allergen-wheat", name: "小麦" },
      { id: "allergen-egg", name: "卵" },
    ],
  }),
  menuItemFixture({
    id: "item-gyoza",
    name: "餃子",
    description: null,
    price: 400,
    category: "side",
    sellable: false,
    allergenCheckState: "checked",
    containedAllergens: [{ id: "allergen-wheat", name: "小麦" }],
  }),
  menuItemFixture({
    id: "item-cola",
    name: "コーラ",
    description: null,
    price: 300,
    category: "drink",
    allergenCheckState: "checked",
  }),
  menuItemFixture({
    id: "item-oolong-tea",
    name: "烏龍茶",
    description: null,
    price: 300,
    category: "drink",
  }),
];
