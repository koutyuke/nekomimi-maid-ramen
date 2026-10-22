import { applyD1Migrations, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const db = env.MIGRATION_DB;

const rowsOf = async (table: string) => (await db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()).results;
const revisions = async () => {
  const rows = (
    await db.prepare("SELECT scope, revision FROM resource_revisions").all<{ scope: string; revision: number }>()
  ).results;
  return {
    menu: rows.find((row) => row.scope === "menu")!.revision,
    orders: rows.find((row) => row.scope === "orders")!.revision,
  };
};

describe("SPEC-INV-001 SPEC-SYS-009 特定原材料と説明文を削除する移行", () => {
  it("商品・在庫・注文の行とリビジョンの更新を保ち、特定原材料と説明文だけを削除する", async () => {
    await applyD1Migrations(
      db,
      env.TEST_MIGRATIONS.filter((entry) => entry.name < "0011"),
    );
    await db.batch([
      db.prepare(
        "INSERT INTO menu_items (id, name, description, price, category, display_order, allergen_check_state, updated_at) VALUES ('ramen', 'ラーメン', '醤油味', 600, 'main', 1, 'checked', 1000), ('tea', '烏龍茶', NULL, 300, 'drink', 2, 'unchecked', 1000)",
      ),
      db.prepare("INSERT INTO allergens (id, name) VALUES ('wheat', '小麦')"),
      db.prepare("INSERT INTO menu_item_allergens (menu_item_id, allergen_id) VALUES ('ramen', 'wheat')"),
      db.prepare("INSERT INTO stocks (menu_item_id, quantity, updated_at) VALUES ('ramen', 8, 1000), ('tea', 0, 1000)"),
      db.prepare(
        "INSERT INTO stock_adjustments (id, menu_item_id, previous_quantity, quantity, adjusted_by, adjusted_at) VALUES ('adjustment', 'ramen', 10, 8, 'admin', 1000)",
      ),
      db.prepare(
        "INSERT INTO orders (id, business_date, order_number, request_id, total_amount, confirmed_at, updated_at) VALUES ('order', '2026-10-24', 1, 'request', 600, 1000, 1000)",
      ),
      db.prepare(
        "INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, cooking_state) VALUES ('order', 'ramen', 1, 600, 'cooking')",
      ),
    ]);
    const before = {
      menuItems: (
        await db
          .prepare("SELECT id, name, price, category, display_order, updated_at FROM menu_items ORDER BY id")
          .all()
      ).results,
      stocks: await rowsOf("stocks"),
      stockAdjustments: await rowsOf("stock_adjustments"),
      orders: await rowsOf("orders"),
      orderLines: await rowsOf("order_lines"),
      revisions: await revisions(),
    };

    await applyD1Migrations(
      db,
      env.TEST_MIGRATIONS.filter((entry) => entry.name >= "0011"),
    );

    expect({
      menuItems: await rowsOf("menu_items"),
      stocks: await rowsOf("stocks"),
      stockAdjustments: await rowsOf("stock_adjustments"),
      orders: await rowsOf("orders"),
      orderLines: await rowsOf("order_lines"),
      revisions: await revisions(),
    }).toEqual(before);
    expect(
      (
        await db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('allergens', 'menu_item_allergens')",
          )
          .all()
      ).results,
    ).toEqual([]);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await expect(db.prepare("UPDATE menu_items SET category = 'invalid'").run()).rejects.toThrow();

    // 作り直した表のトリガーが、移行前と同じ条件でリビジョンを進めることを確かめる。
    await db.prepare("UPDATE stocks SET quantity = 7 WHERE menu_item_id = 'ramen'").run();
    await db.prepare("UPDATE order_lines SET cooking_state = 'completed'").run();
    await db.prepare("UPDATE menu_items SET name = 'ウーロン茶' WHERE id = 'tea'").run();
    expect(await revisions()).toEqual({ menu: before.revisions.menu + 2, orders: before.revisions.orders + 2 });
  });
});
