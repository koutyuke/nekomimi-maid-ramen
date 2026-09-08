import { Schema } from "effect";

import { CookingState } from "../../features/sales/public";
import type { MenuItemId } from "../../core/domain/ids";
import type { OrderStockShortage } from "../../features/sales/public";
import type { Order } from "../../features/sales/public";

export const ConfirmedOrderResponse = Schema.Struct({
  orderId: Schema.String.annotations({ description: "注文の識別子" }),
  businessDate: Schema.String.annotations({ description: "注文番号を数える営業日（YYYY-MM-DD）" }),
  orderNumber: Schema.Int.annotations({ description: "営業日ごとに1から始まる注文番号" }),
  totalAmount: Schema.Int.annotations({ description: "確定時の合計金額（円）" }),
  cookingState: CookingState.annotations({ description: "調理状況" }),
  lines: Schema.Array(
    Schema.Struct({
      menuItemId: Schema.String.annotations({ description: "メニュー項目の識別子" }),
      quantity: Schema.Int.annotations({ description: "個数" }),
      unitPrice: Schema.Int.annotations({ description: "確定時の単価（円）" }),
      subtotal: Schema.Int.annotations({ description: "確定時の小計（円）" }),
    }),
  ).annotations({ description: "確定した注文の明細" }),
}).annotations({ description: "確定した注文" });
export type ConfirmedOrderResponse = Schema.Schema.Type<typeof ConfirmedOrderResponse>;

export const OutOfStockResponse = Schema.Struct({
  code: Schema.Literal("out_of_stock").annotations({ description: "確定できない理由" }),
  shortages: Schema.Array(
    Schema.Struct({
      menuItemId: Schema.String.annotations({ description: "不足している商品の識別子" }),
      requested: Schema.Int.annotations({ description: "確定しようとした個数" }),
      available: Schema.Int.annotations({ description: "確定時点で販売できる個数" }),
    }),
  ).annotations({ description: "不足している商品" }),
}).annotations({ description: "在庫不足で確定できなかった注文" });
export type OutOfStockResponse = Schema.Schema.Type<typeof OutOfStockResponse>;

export const UnknownMenuItemResponse = Schema.Struct({
  code: Schema.Literal("unknown_menu_item").annotations({ description: "確定できない理由" }),
  menuItemIds: Schema.Array(Schema.String).annotations({ description: "販売していない商品の識別子" }),
}).annotations({ description: "販売していない商品を含む注文" });
export type UnknownMenuItemResponse = Schema.Schema.Type<typeof UnknownMenuItemResponse>;

export const InvalidOrderResponse = Schema.Struct({
  code: Schema.Literal("invalid_order").annotations({ description: "確定できない理由" }),
  reason: Schema.String.annotations({ description: "受け付けられない箇所" }),
}).annotations({ description: "入力として成立していない注文" });
export type InvalidOrderResponse = Schema.Schema.Type<typeof InvalidOrderResponse>;

export const RejectedOrderResponse = Schema.Union(UnknownMenuItemResponse, InvalidOrderResponse).annotations({
  description: "内容が成立せず確定できなかった注文",
});
export type RejectedOrderResponse = Schema.Schema.Type<typeof RejectedOrderResponse>;

export const presentConfirmedOrder = (order: Order): ConfirmedOrderResponse => ({
  orderId: order.id,
  businessDate: order.businessDate,
  orderNumber: order.orderNumber,
  totalAmount: order.totalAmount,
  cookingState: order.cookingState,
  lines: order.lines.map((line) => ({
    menuItemId: line.menuItemId,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    subtotal: line.unitPrice * line.quantity,
  })),
});

export const presentOutOfStock = (shortages: ReadonlyArray<OrderStockShortage>): OutOfStockResponse => ({
  code: "out_of_stock",
  shortages: shortages.map((shortage) => ({
    menuItemId: shortage.menuItemId,
    requested: shortage.requested,
    available: shortage.available,
  })),
});

export const presentUnknownMenuItem = (menuItemIds: ReadonlyArray<MenuItemId>): UnknownMenuItemResponse => ({
  code: "unknown_menu_item",
  menuItemIds: [...menuItemIds],
});
