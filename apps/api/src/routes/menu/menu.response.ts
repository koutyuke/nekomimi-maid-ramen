import { Option, Schema } from "effect";

import { AllergenCheckState, type MenuEntry, MenuCategory } from "../../features/visitor-information";

export const MenuResponse = Schema.Struct({
  items: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      description: Schema.NullOr(Schema.String),
      price: Schema.Int,
      category: MenuCategory,
      sellable: Schema.Boolean,
      allergenCheckState: AllergenCheckState,
      containedAllergens: Schema.Array(Schema.Struct({ id: Schema.String, name: Schema.String })),
    }),
  ),
});
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
