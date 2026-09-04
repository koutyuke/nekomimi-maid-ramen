import { Schema } from "effect";

export const MenuItemId = Schema.String.pipe(Schema.nonEmptyString(), Schema.brand("MenuItemId"));
export type MenuItemId = Schema.Schema.Type<typeof MenuItemId>;
