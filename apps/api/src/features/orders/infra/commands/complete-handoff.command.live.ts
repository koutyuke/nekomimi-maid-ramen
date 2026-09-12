import { and, eq, exists, isNull, ne, notExists, or } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { Database } from "../../../../core/infra/drizzle";
import { CompleteHandoffCommand } from "../../application/ports/outbound/complete-handoff.command";
import { HandoffConflict } from "../../domain/order";

export const makeCompleteHandoffCommandLive = (ownerEmail: string) =>
  Layer.effect(
    CompleteHandoffCommand,
    Effect.gen(function* () {
      const database = yield* Database;
      const { orders: ordersTable, orderLines: linesTable, users: usersTable } = Database.tables;
      return CompleteHandoffCommand.of({
        execute: (actorId, id) => {
          const handedOffAt = new Date();
          return database
            .run("受け渡しの完了", (db) =>
              db
                .update(ordersTable)
                .set({ handedOffAt, updatedAt: handedOffAt })
                // 全商品の完成、取消、二重実行、権限剥奪を一つの更新文で判定する。
                .where(
                  and(
                    eq(ordersTable.id, id),
                    isNull(ordersTable.cancelledAt),
                    isNull(ordersTable.handedOffAt),
                    exists(
                      db
                        .select({ id: linesTable.orderId })
                        .from(linesTable)
                        .where(eq(linesTable.orderId, ordersTable.id)),
                    ),
                    notExists(
                      db
                        .select({ id: linesTable.orderId })
                        .from(linesTable)
                        .where(and(eq(linesTable.orderId, ordersTable.id), ne(linesTable.cookingState, "completed"))),
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
                  ),
                )
                .returning({ id: ordersTable.id }),
            )
            .pipe(
              Effect.flatMap((rows) =>
                rows.length === 1 ? Effect.succeed(handedOffAt) : Effect.fail(new HandoffConflict()),
              ),
            );
        },
      });
    }),
  );
