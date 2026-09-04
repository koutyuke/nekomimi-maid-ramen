import { Schema } from "effect";

import { MenuItemId } from "../../../core/domain/ids";
import { Price } from "../../../core/domain/money";
import { Allergen } from "./allergen";

export const ItemName = Schema.String.pipe(Schema.nonEmptyString(), Schema.maxLength(40), Schema.brand("ItemName"));
export type ItemName = Schema.Schema.Type<typeof ItemName>;

export const Description = Schema.String.pipe(Schema.nonEmptyString(), Schema.brand("Description"));
export type Description = Schema.Schema.Type<typeof Description>;

export const DisplayOrder = Schema.Int.pipe(Schema.positive(), Schema.brand("DisplayOrder"));
export type DisplayOrder = Schema.Schema.Type<typeof DisplayOrder>;

export const MenuCategory = Schema.Literal("main", "side", "drink");
export type MenuCategory = Schema.Schema.Type<typeof MenuCategory>;

export const AllergenCheckState = Schema.Literal("unchecked", "checked");
export type AllergenCheckState = Schema.Schema.Type<typeof AllergenCheckState>;

export class MenuItem extends Schema.Class<MenuItem>("MenuItem")({
  id: MenuItemId,
  name: ItemName,
  description: Schema.OptionFromNullOr(Description),
  price: Price,
  category: MenuCategory,
  displayOrder: DisplayOrder,
  allergenCheckState: AllergenCheckState,
  containedAllergens: Schema.Array(Allergen),
}) {}
