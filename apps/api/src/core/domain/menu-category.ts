import { Schema } from "effect";

import { MENU_CATEGORIES } from "@nekomimi/core/models";

export const MenuCategory = Schema.Literal(...MENU_CATEGORIES);
export type MenuCategory = Schema.Schema.Type<typeof MenuCategory>;
