import { sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { StockRepository } from "../../application/ports/outbound/stock.repository";
import { Stock, StockAdjustment } from "../../domain/stock";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { StockQuantity } from "../../domain/stock";

const decodeStocks = Schema.decodeUnknown(Schema.Array(Stock));
const decodeAdjustment = Schema.decodeUnknown(StockAdjustment);

export const StockRepositoryLive = Layer.effect(
  StockRepository,
  Effect.gen(function* () {
    const database = yield* Database;

    const service = {
      findMany: () =>
        database
          .run("在庫の一覧取得", (db) => db.select().from(Database.tables.stocks).all())
          .pipe(
            Effect.flatMap((rows) =>
              decodeStocks(rows).pipe(
                Effect.mapError((cause) => new PersistenceError({ operation: "在庫の復元", cause })),
              ),
            ),
          ),
      adjust: (actorId: string, menuItemId: MenuItemId, quantity: StockQuantity) => {
        const adjustedAt = new Date();
        const adjustedAtMs = adjustedAt.getTime();
        const adjustmentId = crypto.randomUUID();
        const { menuItems, stockAdjustments, stocks, users } = Database.tables;

        return database
          .run("在庫の修正", (db) =>
            db.batch([
              db
                .insert(stockAdjustments)
                .select(
                  sql`select ${adjustmentId}, ${menuItemId}, coalesce(${stocks.quantity}, 0), ${quantity}, ${actorId}, ${adjustedAtMs}
                      from ${menuItems}
                      left join ${stocks} on ${stocks.menuItemId} = ${menuItems.id}
                      where ${menuItems.id} = ${menuItemId}
                        and exists (
                          select 1 from ${users}
                          where ${users.id} = ${actorId}
                            and ${users.role} in ('Owner', 'Admin')
                        )`,
                )
                .returning(),
              db
                .insert(stocks)
                .select(
                  sql`select ${menuItemId}, ${quantity}, ${adjustedAtMs}
                      from ${menuItems}
                      where ${menuItems.id} = ${menuItemId}
                        and exists (
                          select 1 from ${users}
                          where ${users.id} = ${actorId}
                            and ${users.role} in ('Owner', 'Admin')
                        )`,
                )
                .onConflictDoUpdate({
                  target: stocks.menuItemId,
                  set: { quantity, updatedAt: adjustedAt },
                })
                .returning({ menuItemId: stocks.menuItemId }),
            ]),
          )
          .pipe(
            Effect.flatMap(([adjustments, updated]) => {
              const adjustment = adjustments[0];
              return adjustment && updated.length === 1
                ? decodeAdjustment(adjustment).pipe(
                    Effect.mapError((cause) => new PersistenceError({ operation: "在庫修正履歴の復元", cause })),
                  )
                : Effect.fail(
                    new PersistenceError({ operation: "在庫の修正", cause: new Error("対象または権限がありません") }),
                  );
            }),
          );
      },
    };

    return service;
  }),
);
