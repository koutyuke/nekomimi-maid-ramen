import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { OrderStockShortage } from "../../../domain/order";

export type OrderStockDemand = {
  readonly menuItemId: MenuItemId;
  readonly quantity: number;
};

/**
 * 注文確定が必要とする在庫確認の契約。販売側の入力とエラー形を所有する。
 */
export class OrderStockAvailability extends Context.Tag("OrderStockAvailability")<
  OrderStockAvailability,
  {
    readonly findShortages: (
      demands: ReadonlyArray<OrderStockDemand>,
    ) => Effect.Effect<ReadonlyArray<OrderStockShortage>, PersistenceError>;
  }
>() {}
