import { Option, Schema } from "effect";

import { AllergenCheckState, type MenuEntry, MenuCategory } from "../../features/visitor-information";

export const MenuResponse = Schema.Struct({
  items: Schema.Array(
    Schema.Struct({
      id: Schema.String.annotations({ description: "メニュー項目の識別子" }),
      name: Schema.String.annotations({ description: "メニュー項目名" }),
      description: Schema.NullOr(Schema.String).annotations({ description: "メニュー項目の説明" }),
      price: Schema.Int.annotations({ description: "税込価格（円）" }),
      category: MenuCategory.annotations({ description: "メニューの分類" }),
      sellable: Schema.Boolean.annotations({ description: "現在販売できるか" }),
      allergenCheckState: AllergenCheckState.annotations({ description: "特定原材料の確認状態" }),
      containedAllergens: Schema.Array(
        Schema.Struct({
          id: Schema.String.annotations({ description: "特定原材料の識別子" }),
          name: Schema.String.annotations({ description: "特定原材料名" }),
        }),
      ).annotations({ description: "含まれることを確認した特定原材料" }),
    }),
  ).annotations({ description: "表示順に並んだメニュー項目" }),
}).annotations({ description: "メニュー一覧" });
export type MenuResponse = Schema.Schema.Type<typeof MenuResponse>;

export const presentMenu = (entries: ReadonlyArray<MenuEntry>): MenuResponse => ({
  items: entries.map(({ menuItem, sellable }) => ({
    id: menuItem.id,
    name: menuItem.name,
    description: Option.getOrNull(menuItem.description),
    price: menuItem.price,
    category: menuItem.category,
    sellable,
    allergenCheckState: menuItem.allergenCheckState,
    containedAllergens: menuItem.containedAllergens.map((allergen) => ({ id: allergen.id, name: allergen.name })),
  })),
});
