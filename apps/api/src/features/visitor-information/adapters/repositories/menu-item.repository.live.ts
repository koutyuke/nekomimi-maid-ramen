import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle/database";
import { allergens, menuItemAllergens, menuItems } from "../../../../core/infra/drizzle/schema";
import { MenuItemRepository } from "../../application/ports/menu-item.repository";
import { MenuItem } from "../../domain/menu-item";

const decodeMenuItems = Schema.decodeUnknown(Schema.Array(MenuItem));

type MenuItemRow = typeof menuItems.$inferSelect;
type AllergenRow = typeof allergens.$inferSelect;

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
              .select({ menuItem: menuItems, allergen: allergens })
              .from(menuItems)
              .leftJoin(menuItemAllergens, eq(menuItemAllergens.menuItemId, menuItems.id))
              .leftJoin(allergens, eq(allergens.id, menuItemAllergens.allergenId))
              .orderBy(menuItems.displayOrder)
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
