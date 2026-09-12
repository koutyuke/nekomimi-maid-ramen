import { eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import { MenuItem } from "../../domain/menu-item";

const decodeMenuItems = Schema.decodeUnknown(Schema.Array(MenuItem));

type MenuItemRow = typeof Database.tables.menuItems.$inferSelect;
type AllergenRow = typeof Database.tables.allergens.$inferSelect;
type JoinedAllergen = {
  id: string | null;
  name: string | null;
};

const groupRows = (rows: ReadonlyArray<{ menuItem: MenuItemRow; allergen: JoinedAllergen | null }>) => {
  const grouped = new Map<string, { menuItem: MenuItemRow; containedAllergens: AllergenRow[] }>();

  for (const row of rows) {
    const entry = grouped.get(row.menuItem.id) ?? { menuItem: row.menuItem, containedAllergens: [] };

    // `leftJoin`の右側がnullの行を捨てると、品目を1件も持たない商品がメニューから消える。
    if (row.allergen && row.allergen.id !== null && row.allergen.name !== null) {
      entry.containedAllergens.push({ id: row.allergen.id, name: row.allergen.name });
    }

    grouped.set(row.menuItem.id, entry);
  }

  return [...grouped.values()].map((entry) => ({
    ...entry.menuItem,
    containedAllergens: entry.containedAllergens,
  }));
};

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
                  allergen: {
                    // D1のbatch結果は列名をキーにするため、商品のid/nameとの重複を避ける。
                    id: sql<string | null>`${Database.tables.allergens.id}`.as("allergen_id"),
                    name: sql<string | null>`${Database.tables.allergens.name}`.as("allergen_name"),
                  },
                  quantity: Database.tables.stocks.quantity,
                })
                .from(Database.tables.menuItems)
                .leftJoin(Database.tables.stocks, eq(Database.tables.stocks.menuItemId, Database.tables.menuItems.id))
                .leftJoin(
                  Database.tables.menuItemAllergens,
                  eq(Database.tables.menuItemAllergens.menuItemId, Database.tables.menuItems.id),
                )
                .leftJoin(
                  Database.tables.allergens,
                  eq(Database.tables.allergens.id, Database.tables.menuItemAllergens.allergenId),
                )
                .orderBy(Database.tables.menuItems.displayOrder),
              db
                .select({ revision: Database.tables.resourceRevisions.revision })
                .from(Database.tables.resourceRevisions)
                .where(eq(Database.tables.resourceRevisions.scope, "menu")),
            ]),
          )
          .pipe(
            Effect.flatMap(([rows, revisions]) =>
              decodeMenuItems(groupRows(rows)).pipe(
                Effect.map((items) => {
                  const quantities = new Map(rows.map((row) => [row.menuItem.id, row.quantity ?? 0]));

                  return {
                    data: items.map((menuItem) => ({
                      menuItem,
                      quantity: quantities.get(menuItem.id)!,
                    })),
                    revision: revisions[0]!.revision,
                  };
                }),
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
