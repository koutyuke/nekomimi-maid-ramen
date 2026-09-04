import { Schema } from "effect";

import { MenuItemId } from "../../../core/domain/ids";

export const StockQuantity = Schema.Int.pipe(Schema.nonNegative(), Schema.brand("StockQuantity"));
export type StockQuantity = Schema.Schema.Type<typeof StockQuantity>;

export class Stock extends Schema.Class<Stock>("Stock")({
  menuItemId: MenuItemId,
  quantity: StockQuantity,
  updatedAt: Schema.DateFromSelf,
}) {}

export const isSellable = (stock: Stock): boolean => stock.quantity > 0;
