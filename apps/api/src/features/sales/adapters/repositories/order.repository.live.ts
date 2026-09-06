import { eq } from "drizzle-orm";
import { Effect, Layer, Option, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle/database";
import { orderLines, orders } from "../../../../core/infra/drizzle/schema";
import { OrderRepository } from "../../application/ports/outbound/order.repository";
import { Order } from "../../domain/order";
import type { ConfirmationRequestId } from "../../domain/order";

const decodeOrder = Schema.decodeUnknown(Order);

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
    };

    return service;
  }),
);
