import { and, eq, exists, inArray, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { StockRepository } from "../../application/ports/outbound/stock.repository";
import { Stock, STOCK_ADJUSTER_ROLES, StockAdjustment } from "../../domain/stock";
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
        const { menuItems, stocks, users } = Database.tables;

        // batchは一つのトランザクションで順に実行するため、読んだ数量は直後の上書きの直前の値になる。
        return database
          .run("在庫の修正", (db) => {
            const adjustable = exists(
              db
                .select({ one: sql`1` })
                .from(users)
                .where(and(eq(users.id, actorId), inArray(users.role, STOCK_ADJUSTER_ROLES))),
            );
            const target = and(eq(menuItems.id, menuItemId), adjustable);

            return db.batch([
              db
                .select({ previousQuantity: sql<number>`coalesce(${stocks.quantity}, 0)` })
                .from(menuItems)
                .leftJoin(stocks, eq(stocks.menuItemId, menuItems.id))
                .where(target),
              db
                .insert(stocks)
                .select(
                  db
                    .select({
                      menuItemId: menuItems.id,
                      quantity: sql<number>`${quantity}`.as("quantity"),
                      updatedAt: sql<Date>`${adjustedAt.getTime()}`.as("updated_at"),
                    })
                    .from(menuItems)
                    .where(target),
                )
                .onConflictDoUpdate({
                  target: stocks.menuItemId,
                  set: { quantity, updatedAt: adjustedAt },
                })
                .returning({ menuItemId: stocks.menuItemId }),
            ]);
          })
          .pipe(
            Effect.flatMap(([previous, updated]) => {
              const previousQuantity = previous[0]?.previousQuantity;
              return previousQuantity !== undefined && updated.length === 1
                ? decodeAdjustment({ menuItemId, previousQuantity, quantity, adjustedAt }).pipe(
                    Effect.mapError((cause) => new PersistenceError({ operation: "在庫修正結果の復元", cause })),
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
