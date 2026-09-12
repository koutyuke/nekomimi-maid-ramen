import type { MenuItem } from "../model/menu";

export const menuItemFixture = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: "item-ramen",
  name: "ラーメン",
  price: 500,
  sellable: true,
  quantity: 30,
  ...overrides,
});

export const menuFixture: readonly MenuItem[] = [
  menuItemFixture(),
  menuItemFixture({
    id: "item-gyoza",
    name: "餃子",
    price: 400,
    sellable: false,
    quantity: 0,
  }),
  menuItemFixture({
    id: "item-cola",
    name: "コーラ",
    price: 300,
  }),
  menuItemFixture({
    id: "item-oolong-tea",
    name: "烏龍茶",
    price: 300,
  }),
];
