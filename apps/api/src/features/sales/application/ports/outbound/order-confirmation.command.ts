import { Context } from "effect";
import type { Effect } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { ConfirmationLostStockRace, DuplicateConfirmation, Order, OrderDraft } from "../../../domain/order";

/**
 * 注文保存と在庫減算を同じ保存操作として確定する契約。
 * D1の具体的なバッチは販売領域のコマンドアダプターで実装する。
 */
export class OrderConfirmationCommand extends Context.Tag("OrderConfirmationCommand")<
  OrderConfirmationCommand,
  {
    readonly execute: (
      draft: OrderDraft,
    ) => Effect.Effect<Order, ConfirmationLostStockRace | DuplicateConfirmation | PersistenceError>;
  }
>() {}
