import { eq, sql } from "drizzle-orm";
import { Effect, Layer, Option, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle/database";
import { orderLines, orders, stocks } from "../../../../core/infra/drizzle/schema";
import { OrderRepository } from "../../application/ports/order.repository";
import { ConfirmationLostStockRace, DuplicateConfirmation, Order } from "../../domain/order";
import type { ConfirmationRequestId, OrderDraft } from "../../domain/order";

const decodeOrder = Schema.decodeUnknown(Order);

const CONFIRM_OPERATION = "注文の確定";

// DEC-SAL-001
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

type OrderRow = typeof orders.$inferSelect;
type OrderLineRow = typeof orderLines.$inferSelect;

const buildOrder = (rows: ReadonlyArray<{ order: OrderRow; line: OrderLineRow | null }>) => {
  const [first] = rows;

  if (first === undefined) {
    return Option.none();
  }

  return Option.some({
    ...first.order,
    lines: rows.flatMap((row) => (row.line === null ? [] : [row.line])),
  });
};

export const OrderRepositoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const database = yield* Database;

    const service = {
      findByRequestId: (requestId: ConfirmationRequestId) =>
        database
          .run("注文の読み出し", (db) =>
            db
              .select({ order: orders, line: orderLines })
              .from(orders)
              .leftJoin(orderLines, eq(orderLines.orderId, orders.id))
              .where(eq(orders.requestId, requestId))
              .all(),
          )
          .pipe(
            Effect.map(buildOrder),
            Effect.flatMap(
              Option.match({
                onNone: () => Effect.succeedNone,
                onSome: (candidate) =>
                  decodeOrder(candidate).pipe(
                    Effect.mapError((cause) => new PersistenceError({ operation: "注文の復元", cause })),
                    Effect.asSome,
                  ),
              }),
            ),
          ),
      confirm: (draft: OrderDraft) =>
        database
          .run(CONFIRM_OPERATION, (db) =>
            db.batch([
              // 1. 注文を保存
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
              // 2. 注文明細を保存
              db.insert(orderLines).values(
                draft.lines.map((line) => ({
                  orderId: draft.id,
                  menuItemId: line.menuItemId,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                })),
              ),
              // 3. 商品ごとの在庫を減らす
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
    };

    return service;
  }),
);
