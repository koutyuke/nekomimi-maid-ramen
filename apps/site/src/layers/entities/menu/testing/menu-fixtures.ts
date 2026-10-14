import { MENU_ITEMS } from "../model/menu";
import type { AllergenStatus, MenuItem } from "../model/menu";

export const allergenStatuses = (status: AllergenStatus): NonNullable<MenuItem["allergens"]> => ({
  "allergen-shrimp": status,
  "allergen-crab": status,
  "allergen-cashew-nut": status,
  "allergen-walnut": status,
  "allergen-wheat": status,
  "allergen-buckwheat": status,
  "allergen-egg": status,
  "allergen-milk": status,
  "allergen-peanut": status,
  "allergen-almond": status,
  "allergen-abalone": status,
  "allergen-squid": status,
  "allergen-salmon-roe": status,
  "allergen-orange": status,
  "allergen-kiwifruit": status,
  "allergen-beef": status,
  "allergen-sesame": status,
  "allergen-salmon": status,
  "allergen-mackerel": status,
  "allergen-soybean": status,
  "allergen-chicken": status,
  "allergen-banana": status,
  "allergen-pistachio": status,
  "allergen-pork": status,
  "allergen-macadamia-nut": status,
  "allergen-peach": status,
  "allergen-yam": status,
  "allergen-apple": status,
  "allergen-gelatin": status,
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

export const checkedRamenFixture: MenuItem = {
  ...ramenFixture,
  description: "濃厚な味噌スープに、厚切りのチャーシューともやしをのせた一杯です。",
  allergens: {
    ...allergenStatuses("absent"),
    "allergen-wheat": "contains",
    "allergen-milk": "may-contain",
    "allergen-pork": "contains",
    "allergen-beef": "may-contain",
  },
};

export const menuItemsFixture: readonly MenuItem[] = MENU_ITEMS.map((item) =>
  item.id === checkedRamenFixture.id ? checkedRamenFixture : item,
);
