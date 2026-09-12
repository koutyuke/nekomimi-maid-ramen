export const MENU_CATEGORIES = ["main", "side", "drink"] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];
