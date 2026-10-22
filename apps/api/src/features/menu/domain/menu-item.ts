import { Schema } from "effect";

import { MenuItemId } from "../../../core/domain/ids";
import { MenuCategory } from "../../../core/domain/menu-category";
import { Price } from "../../../core/domain/money";

export { MenuCategory } from "../../../core/domain/menu-category";

export const ItemName = Schema.String.pipe(Schema.nonEmptyString(), Schema.maxLength(40), Schema.brand("ItemName"));
export type ItemName = Schema.Schema.Type<typeof ItemName>;

export const DisplayOrder = Schema.Int.pipe(Schema.positive(), Schema.brand("DisplayOrder"));
export type DisplayOrder = Schema.Schema.Type<typeof DisplayOrder>;

export class MenuItem extends Schema.Class<MenuItem>("MenuItem")({
  id: MenuItemId,
  name: ItemName,
  price: Price,
  category: MenuCategory,
  displayOrder: DisplayOrder,
}) {}
