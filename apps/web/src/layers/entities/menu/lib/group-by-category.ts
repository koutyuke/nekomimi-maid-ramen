import type { MenuCategory, MenuItem } from "../model/menu";

export type MenuCategoryGroup = {
  category: MenuCategory;
  items: readonly MenuItem[];
};

// 並び順はAPIが返した表示順に従う。分類の順序は最初に現れた商品の位置で決まる。
export const groupByCategory = (items: readonly MenuItem[]): readonly MenuCategoryGroup[] => {
  const grouped = new Map<MenuCategory, MenuItem[]>();

  for (const item of items) {
    const group = grouped.get(item.category);

    if (group === undefined) {
      grouped.set(item.category, [item]);
    } else {
      group.push(item);
    }
  }

  return [...grouped].map(([category, categoryItems]) => ({ category, items: categoryItems }));
};
