import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const menuItems = sqliteTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    category: text("category", { enum: ["main", "side", "drink"] }).notNull(),
    displayOrder: integer("display_order").notNull(),
    allergenCheckState: text("allergen_check_state", { enum: ["unchecked", "checked"] }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check("menu_items_category", sql`${table.category} in ('main', 'side', 'drink')`),
    check("menu_items_allergen_check_state", sql`${table.allergenCheckState} in ('unchecked', 'checked')`),
  ],
);

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
    handedOffAt: integer("handed_off_at", { mode: "timestamp_ms" }),
    cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
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
    cookingState: text("cooking_state", { enum: ["unstarted", "cooking", "completed"] })
      .notNull()
      .default("unstarted"),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.menuItemId] }),
    check("order_lines_quantity_range", sql`${table.quantity} between 1 and 10`),
    check("order_lines_cooking_state", sql`${table.cookingState} in ('unstarted', 'cooking', 'completed')`),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    role: text("role", { enum: ["Admin", "Staff", "None"] })
      .notNull()
      .default("None"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [check("users_role", sql`${table.role} in ('Admin', 'Staff', 'None')`)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [index("sessions_user_id").on(table.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("accounts_user_id").on(table.userId),
    uniqueIndex("accounts_provider_subject").on(table.providerId, table.accountId),
  ],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("verifications_identifier").on(table.identifier)],
);
