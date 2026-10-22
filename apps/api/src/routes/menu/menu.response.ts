import { Schema } from "effect";

import { MenuCategory } from "../../features/menu/public";
import type { StaffMenuEntry } from "../../features/menu/public";

export const StaffMenuResponse = Schema.Struct({
  revision: Schema.Int.pipe(Schema.nonNegative()),
  items: Schema.Array(
    Schema.Struct({
      id: Schema.String.annotations({ description: "メニュー項目の識別子" }),
      name: Schema.String.annotations({ description: "メニュー項目名" }),
      price: Schema.Int.annotations({ description: "税込価格（円）" }),
      category: MenuCategory.annotations({ description: "メニューの分類" }),
      sellable: Schema.Boolean.annotations({ description: "現在販売できるか" }),
      quantity: Schema.Int.pipe(Schema.nonNegative()).annotations({ description: "現在の在庫残数" }),
    }),
  ).annotations({ description: "表示順に並んだメニュー項目" }),
});
export type StaffMenuResponse = Schema.Schema.Type<typeof StaffMenuResponse>;

export const presentStaffMenu = ({ data, revision }: StaffMenuEntry): StaffMenuResponse => ({
  revision,
  items: data.map(({ menuItem, quantity, sellable }) => ({
    id: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    category: menuItem.category,
    sellable,
    quantity,
  })),
});
