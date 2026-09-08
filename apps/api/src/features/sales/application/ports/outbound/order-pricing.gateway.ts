import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { Price } from "../../../../../core/domain/money";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";

export type OrderPrice = {
  readonly menuItemId: MenuItemId;
  readonly price: Price;
};

/**
 * 注文確定が商品情報領域へ価格参照を要求するGateway。商品情報の保存方法を販売へ漏らさない。
 */
export class OrderPricingGateway extends Context.Tag("OrderPricingGateway")<
  OrderPricingGateway,
  {
    readonly findPrices: (
      menuItemIds: ReadonlyArray<MenuItemId>,
    ) => Effect.Effect<ReadonlyArray<OrderPrice>, PersistenceError>;
  }
>() {}
