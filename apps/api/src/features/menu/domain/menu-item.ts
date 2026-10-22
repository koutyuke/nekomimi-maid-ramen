import { Data, Schema } from "effect";

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

export const PRICE_EDITOR_ROLES = ["Owner", "Admin"] as const;

export const canChangePrice = (role: string): boolean => PRICE_EDITOR_ROLES.some((editor) => editor === role);

export class MenuPriceChangeForbidden extends Data.TaggedError("MenuPriceChangeForbidden") {}
export class MenuItemNotFound extends Data.TaggedError("MenuItemNotFound") {}

/**
 * 価格変更の結果。
 *
 * @param changed 価格が変わったか。同じ価格への変更では`false`とし、`updatedAt`は変更前のままとなる。
 */
export class MenuPriceChange extends Schema.Class<MenuPriceChange>("MenuPriceChange")({
  menuItemId: MenuItemId,
  price: Price,
  updatedAt: Schema.DateFromSelf,
  changed: Schema.Boolean,
}) {}
