export { MENU_CATEGORIES, MENU_CATEGORY_LABEL } from "@nekomimi/core/models";
export type { MenuCategory, Allergen, AllergenCheckState } from "@nekomimi/core/models";
import type { MenuItem as PublicMenuItem } from "@nekomimi/core/models";

export type MenuItem = PublicMenuItem & { quantity: number };
