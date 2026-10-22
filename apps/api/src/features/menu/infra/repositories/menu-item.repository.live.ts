import { and, eq, exists, inArray, ne } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import {
  MenuItem,
  MenuItemNotFound,
  MenuPriceChange,
  MenuPriceChangeForbidden,
  PRICE_EDITOR_ROLES,
} from "../../domain/menu-item";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { Price } from "../../../../core/domain/money";

const decodeMenuItems = Schema.decodeUnknown(Schema.Array(MenuItem));
const decodePriceChange = Schema.decodeUnknown(MenuPriceChange);

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
      changePrice: (actorId: string, menuItemId: MenuItemId, price: Price) => {
        const updatedAt = new Date();
        const { menuItems, users } = Database.tables;

        return database
          .run("価格の変更", (db) => {
            const editable = exists(
              db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, actorId), inArray(users.role, PRICE_EDITOR_ROLES))),
            );

            return db.batch([
              db
                .select({ price: menuItems.price, updatedAt: menuItems.updatedAt })
                .from(menuItems)
                .where(eq(menuItems.id, menuItemId)),
              db
                .update(menuItems)
                .set({ price, updatedAt })
                .where(and(eq(menuItems.id, menuItemId), ne(menuItems.price, price), editable))
                .returning({ price: menuItems.price, updatedAt: menuItems.updatedAt }),
            ]);
          })
          .pipe(
            Effect.flatMap(
              ([[current], [updated]]): Effect.Effect<
                MenuPriceChange,
                MenuItemNotFound | MenuPriceChangeForbidden | PersistenceError
              > => {
                if (!current) {
                  return Effect.fail(new MenuItemNotFound());
                }
                if (!updated && current.price !== price) {
                  return Effect.fail(new MenuPriceChangeForbidden());
                }
                return decodePriceChange({ menuItemId, ...(updated ?? current), changed: updated !== undefined }).pipe(
                  Effect.mapError((cause) => new PersistenceError({ operation: "価格変更結果の復元", cause })),
                );
              },
            ),
          );
      },
    };

    return service;
  }),
);
