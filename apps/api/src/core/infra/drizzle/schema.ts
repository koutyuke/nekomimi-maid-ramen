import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  displayOrder: integer("display_order").notNull(),
  allergenCheckState: text("allergen_check_state").notNull(),
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
  // DEC-SYS-005
  (table) => [check("stocks_quantity_non_negative", sql`${table.quantity} >= 0`)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    businessDate: text("business_date").notNull(),
    orderNumber: integer("order_number").notNull(),
    requestId: text("request_id").notNull(),
    totalAmount: integer("total_amount").notNull(),
    cookingState: text("cooking_state").notNull(),
    confirmedAt: integer("confirmed_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("orders_business_date_order_number_unique").on(table.businessDate, table.orderNumber),
    uniqueIndex("orders_request_id_unique").on(table.requestId),
    check("orders_order_number_positive", sql`${table.orderNumber} > 0`),
  ],
);

export const orderLines = sqliteTable(
  "order_lines",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItems.id),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.menuItemId] }),
    check("order_lines_quantity_range", sql`${table.quantity} between 1 and 10`),
  ],
);
