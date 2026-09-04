import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: text("category", { enum: ["main", "side", "drink"] }).notNull(),
  displayOrder: integer("display_order").notNull(),
  allergenCheckState: text("allergen_check_state", { enum: ["unchecked", "checked"] }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const allergens = sqliteTable(
  "allergens",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("allergens_name_unique").on(table.name)],
);

export const menuItemAllergens = sqliteTable(
  "menu_item_allergens",
  {
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    allergenId: text("allergen_id")
      .notNull()
      .references(() => allergens.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.menuItemId, table.allergenId] })],
);

export const stocks = sqliteTable(
  "stocks",
  {
    menuItemId: text("menu_item_id")
      .primaryKey()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  // D1に対話型のトランザクションがないため、読み取った在庫を判断してから書き込めない。
  // 在庫不足を制約違反として現し、バッチ全体を取り消す。
  (table) => [check("stocks_quantity_non_negative", sql`${table.quantity} >= 0`)],
);
