import { and, eq, exists, isNull, or } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { Database } from "../../../../core/infra/drizzle";
import { UpdateCookingStateCommand } from "../../application/ports/outbound/update-cooking-state.command";
import { KitchenOrderConflict } from "../../domain/order";

export const makeUpdateCookingStateCommandLive = (ownerEmail: string) =>
  Layer.effect(
    UpdateCookingStateCommand,
    Effect.gen(function* () {
      const database = yield* Database;
      const { orders: ordersTable, users: usersTable, orderLines: linesTable } = Database.tables;
      return UpdateCookingStateCommand.of({
        execute: (actorId, id, menuItemId, from, to) =>
          database
            .run("調理状況の更新", (db) =>
              db
                .update(linesTable)
                .set({ cookingState: to })
                // 読み取り後の取消・状態変更・権限剥奪も、同じ更新文の条件で拒否する。
                .where(
                  and(
                    eq(linesTable.orderId, id),
                    eq(linesTable.menuItemId, menuItemId),
                    eq(linesTable.cookingState, from),
                    exists(
                      db
                        .select({ id: ordersTable.id })
                        .from(ordersTable)
                        .where(
                          and(
                            eq(ordersTable.id, linesTable.orderId),
                            isNull(ordersTable.cancelledAt),
                            isNull(ordersTable.handedOffAt),
                          ),
                        ),
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
                .returning({ id: linesTable.orderId }),
            )
            .pipe(
              Effect.flatMap((rows) => (rows.length === 1 ? Effect.void : Effect.fail(new KitchenOrderConflict()))),
            ),
      });
    }),
  );
