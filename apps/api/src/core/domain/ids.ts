import { Schema } from "effect";

export const MenuItemId = Schema.String.pipe(Schema.nonEmptyString(), Schema.brand("MenuItemId"));
export type MenuItemId = Schema.Schema.Type<typeof MenuItemId>;

export const OrderId = Schema.String.pipe(Schema.nonEmptyString(), Schema.brand("OrderId"));
export type OrderId = Schema.Schema.Type<typeof OrderId>;
