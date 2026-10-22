import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import { MenuItem } from "../../domain/menu-item";

const decodeMenuItems = Schema.decodeUnknown(Schema.Array(MenuItem));

export const MenuItemRepositoryLive = Layer.effect(
  MenuItemRepository,
  Effect.gen(function* () {
    const database = yield* Database;

    const service = {
      findMany: () =>
        database
          .run("商品の一覧取得", (db) =>
            db.batch([
              db
                .select({
                  menuItem: Database.tables.menuItems,
                  quantity: Database.tables.stocks.quantity,
                })
                .from(Database.tables.menuItems)
                .leftJoin(Database.tables.stocks, eq(Database.tables.stocks.menuItemId, Database.tables.menuItems.id))
                .orderBy(Database.tables.menuItems.displayOrder),
              db
                .select({ revision: Database.tables.resourceRevisions.revision })
                .from(Database.tables.resourceRevisions)
                .where(eq(Database.tables.resourceRevisions.scope, "menu")),
            ]),
          )
          .pipe(
            Effect.flatMap(([rows, revisions]) =>
              decodeMenuItems(rows.map((row) => row.menuItem)).pipe(
                Effect.map((items) => ({
                  data: items.map((menuItem, index) => ({
                    menuItem,
                    quantity: rows[index]!.quantity ?? 0,
                  })),
                  revision: revisions[0]!.revision,
                })),
                Effect.mapError((cause) => new PersistenceError({ operation: "商品の復元", cause })),
              ),
            ),
          ),
      getRevision: () =>
        database.run("メニューのリビジョン取得", async (db) => {
          const row = await db
            .select({ revision: Database.tables.resourceRevisions.revision })
            .from(Database.tables.resourceRevisions)
            .where(eq(Database.tables.resourceRevisions.scope, "menu"))
            .get();

          if (!row) {
            throw new Error("Missing menu revision");
          }

          return row.revision;
        }),
    };

    return service;
  }),
);
