import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import { MenuItem } from "../../domain/menu-item";

const decodeMenuItems = Schema.decodeUnknown(Schema.Array(MenuItem));

type MenuItemRow = typeof Database.tables.menuItems.$inferSelect;
type AllergenRow = typeof Database.tables.allergens.$inferSelect;

const groupRows = (rows: ReadonlyArray<{ menuItem: MenuItemRow; allergen: AllergenRow | null }>) => {
  const grouped = new Map<string, { menuItem: MenuItemRow; containedAllergens: AllergenRow[] }>();

  for (const row of rows) {
    const entry = grouped.get(row.menuItem.id) ?? { menuItem: row.menuItem, containedAllergens: [] };

    // `leftJoin`の右側がnullの行を捨てると、品目を1件も持たない商品がメニューから消える。
    if (row.allergen !== null) {
      entry.containedAllergens.push(row.allergen);
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
      listInDisplayOrder: () =>
        database
          .run("商品の一覧取得", (db) =>
            db
              .select({ menuItem: Database.tables.menuItems, allergen: Database.tables.allergens })
              .from(Database.tables.menuItems)
              .leftJoin(
                Database.tables.menuItemAllergens,
                eq(Database.tables.menuItemAllergens.menuItemId, Database.tables.menuItems.id),
              )
              .leftJoin(
                Database.tables.allergens,
                eq(Database.tables.allergens.id, Database.tables.menuItemAllergens.allergenId),
              )
              .orderBy(Database.tables.menuItems.displayOrder)
              .all(),
          )
          .pipe(
            Effect.flatMap((rows) =>
              decodeMenuItems(groupRows(rows)).pipe(
                Effect.mapError((cause) => new PersistenceError({ operation: "商品の復元", cause })),
              ),
            ),
          ),
    };

    return service;
  }),
);
