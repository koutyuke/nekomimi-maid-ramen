import { MENU_ITEMS } from "../model/menu";
import type { AllergenId, AllergenStatus, MenuItem } from "../model/menu";

// 試験とStorybookで使う商品データ。実データは原材料が未確認のため、確認済みの状態はここで作る。

export const allergenStatuses = (status: AllergenStatus): Record<AllergenId, AllergenStatus> => ({
  "allergen-shrimp": status,
  "allergen-crab": status,
  "allergen-cashew-nut": status,
  "allergen-walnut": status,
  "allergen-wheat": status,
  "allergen-buckwheat": status,
  "allergen-egg": status,
  "allergen-milk": status,
  "allergen-peanut": status,
});

const findItem = (id: string): MenuItem => {
  const item = MENU_ITEMS.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`商品 ${id} がない`);
  }
  return item;
};

export const ramenFixture = findItem("item-ramen");
export const gyozaFixture = findItem("item-gyoza");
export const colaFixture = findItem("item-cola");

// 小麦を使い、乳を含む可能性がある、確認済みの商品。
export const checkedRamenFixture: MenuItem = {
  ...ramenFixture,
  description: "濃厚な味噌スープに、厚切りのチャーシューともやしをのせた一杯です。",
  allergens: { ...allergenStatuses("absent"), "allergen-wheat": "contains", "allergen-milk": "may-contain" },
};

export const menuItemsFixture: readonly MenuItem[] = MENU_ITEMS.map((item) =>
  item.id === checkedRamenFixture.id ? checkedRamenFixture : item,
);
