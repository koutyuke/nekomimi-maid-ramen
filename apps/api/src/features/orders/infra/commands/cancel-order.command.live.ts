import { and, eq, exists, isNull, notExists, or, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { Database } from "../../../../core/infra/drizzle";
import { CancelOrderCommand } from "../../application/ports/outbound/cancel-order.command";
import { OrderCancellationConflict } from "../../domain/order";

export const makeCancelOrderCommandLive = (ownerEmail: string) =>
  Layer.effect(
    CancelOrderCommand,
    Effect.gen(function* () {
      const database = yield* Database;

      const { orders: ordersTable, orderLines: linesTable, stocks: stocksTable, users: usersTable } = Database.tables;

      return CancelOrderCommand.of({
        execute: (actorId, id) => {
          const cancelledAt = new Date();

          return database
            .run("注文の取消", (db) => {
              const eligible = and(
                eq(ordersTable.id, id),
                isNull(ordersTable.cancelledAt),
                isNull(ordersTable.handedOffAt),
                notExists(
                  db
                    .select({ id: linesTable.orderId })
                    .from(linesTable)
                    .where(and(eq(linesTable.orderId, ordersTable.id), eq(linesTable.cookingState, "completed"))),
                ),
                exists(
                  db
                    .select({ id: usersTable.id })
                    .from(usersTable)
                    .where(
                      and(
                        eq(usersTable.id, actorId),
                        or(
                          eq(usersTable.role, "Staff"),
                          eq(usersTable.role, "Admin"),
                          ownerEmail === "" ? undefined : eq(usersTable.email, ownerEmail),
                        ),
                      ),
                    ),
                ),
              );
              // 同じ取消可否・権限条件で在庫を先に戻し、取消記録まで一つのバッチで保存する。
              // 取消記録が失敗すれば在庫復元も取り消されるため、再送や同時操作でも復元は一度だけになる。
              return db.batch([
                db
                  .insert(stocksTable)
                  .select(
                    sql`select ${linesTable.menuItemId}, ${linesTable.quantity}, ${cancelledAt.getTime()}
                      from ${linesTable} inner join ${ordersTable} on ${linesTable.orderId} = ${ordersTable.id}
                      where ${eligible}`,
                  )
                  .onConflictDoUpdate({
                    target: stocksTable.menuItemId,
                    set: { quantity: sql`${stocksTable.quantity} + excluded.quantity`, updatedAt: cancelledAt },
                  }),
                db
                  .update(ordersTable)
                  .set({ cancelledAt, cancelledBy: actorId, updatedAt: cancelledAt })
                  .where(eligible)
                  .returning({ id: ordersTable.id }),
              ]);
            })
            .pipe(
              Effect.flatMap(([, rows]) =>
                rows.length === 1 ? Effect.succeed(cancelledAt) : Effect.fail(new OrderCancellationConflict()),
              ),
            );
        },
      });
    }),
  );
