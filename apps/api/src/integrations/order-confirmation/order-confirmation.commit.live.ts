import { eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../core/domain/persistence-error";
import { Database } from "../../core/infra/drizzle/database";
import { orderLines, orders, stocks } from "../../core/infra/drizzle/schema";
import {
  ConfirmationLostStockRace,
  DuplicateConfirmation,
  Order,
  OrderConfirmationCommit,
} from "../../features/sales/public";
import type { ConfirmationRequestId, OrderDraft } from "../../features/sales/public";

const decodeOrder = Schema.decodeUnknown(Order);
const CONFIRM_OPERATION = "注文の確定";
const STOCK_SHORTAGE_CONSTRAINT = "stocks_quantity_non_negative";
const DUPLICATE_REQUEST_CONSTRAINT = "orders.request_id";

const classifyConfirmFailure = (error: PersistenceError, requestId: ConfirmationRequestId) => {
  if (error.message.includes(STOCK_SHORTAGE_CONSTRAINT)) {
    return new ConfirmationLostStockRace({ requestId });
  }

  if (error.message.includes(DUPLICATE_REQUEST_CONSTRAINT)) {
    return new DuplicateConfirmation({ requestId });
  }

  return error;
};

const nextOrderNumber = (businessDate: string) =>
  sql<number>`(select coalesce(max(${orders.orderNumber}), 0) + 1 from ${orders} where ${orders.businessDate} = ${businessDate})`;

export const OrderConfirmationCommitLive = Layer.effect(
  OrderConfirmationCommit,
  Effect.gen(function* () {
    const database = yield* Database;

    return OrderConfirmationCommit.of({
      commit: (draft: OrderDraft) =>
        database
          .run(CONFIRM_OPERATION, (db) =>
            db.batch([
              // 注文、明細、在庫を一つのバッチへ入れ、途中の失敗で片方だけ成立しないようにする。
              db
                .insert(orders)
                .values({
                  id: draft.id,
                  businessDate: draft.businessDate,
                  orderNumber: nextOrderNumber(draft.businessDate),
                  requestId: draft.requestId,
                  totalAmount: draft.totalAmount,
                  cookingState: draft.cookingState,
                  confirmedAt: draft.confirmedAt,
                  updatedAt: draft.confirmedAt,
                })
                .returning({ orderNumber: orders.orderNumber }),
              db.insert(orderLines).values(
                draft.lines.map((line) => ({
                  orderId: draft.id,
                  menuItemId: line.menuItemId,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                })),
              ),
              ...draft.lines.map((line) =>
                db
                  .update(stocks)
                  .set({ quantity: sql`${stocks.quantity} - ${line.quantity}`, updatedAt: draft.confirmedAt })
                  .where(eq(stocks.menuItemId, line.menuItemId)),
              ),
            ]),
          )
          .pipe(
            Effect.mapError((error) => classifyConfirmFailure(error, draft.requestId)),
            Effect.flatMap(([confirmed]) =>
              decodeOrder({
                id: draft.id,
                businessDate: draft.businessDate,
                orderNumber: confirmed[0]?.orderNumber,
                requestId: draft.requestId,
                lines: draft.lines,
                totalAmount: draft.totalAmount,
                cookingState: draft.cookingState,
                confirmedAt: draft.confirmedAt,
              }).pipe(Effect.mapError((cause) => new PersistenceError({ operation: "確定した注文の復元", cause }))),
            ),
          ),
    });
  }),
);
