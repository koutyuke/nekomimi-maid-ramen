import type { MenuCategory } from "@nekomimi/core/models";

// 分類はメニューの見出しをまとめる単位である。表示名はここだけで決める。
export const MENU_CATEGORY_LABEL: Record<MenuCategory, string> = {
  main: "ラーメン",
  side: "サイドメニュー",
  drink: "ドリンク",
};

export type AllergenCheckState = "unchecked" | "checked";

export type Allergen = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: MenuCategory;
  sellable: boolean;
  allergenCheckState: AllergenCheckState;
  containedAllergens: readonly Allergen[];
};
