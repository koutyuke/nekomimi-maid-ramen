import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

const db = env.MIGRATION_DB;
const migration = env.TEST_MIGRATIONS.find((entry) => entry.name === "0005_free_black_tarantula.sql")!;

beforeEach(async () => {
  await db.batch(
    [
      "order_lines",
      "accounts",
      "sessions",
      "menu_item_allergens",
      "stocks",
      "orders",
      "menu_items",
      "allergens",
      "users",
      "verifications",
      "d1_migrations",
    ].map((table) => db.prepare(`DROP TABLE IF EXISTS "${table}"`)),
  );
  await applyD1Migrations(
    db,
    env.TEST_MIGRATIONS.filter((entry) => entry.name < "0005"),
  );
  await db
    .prepare(
      "INSERT INTO menu_items (id, name, price, category, display_order, allergen_check_state, updated_at) VALUES ('ramen', 'ラーメン', 500, 'main', 1, 'unchecked', 1000)",
    )
    .run();
});

describe("SPEC-VIS-002 メニュー列挙値の移行", () => {
  it("不正な旧データを検出したら移行を取り消す", async () => {
    await db.prepare("UPDATE menu_items SET category = 'invalid'").run();

    await expect(applyD1Migrations(db, [migration])).rejects.toThrow();
    expect(await db.prepare("SELECT category FROM menu_items WHERE id = 'ramen'").first("category")).toBe("invalid");
  });

  it("既存データと参照を保持し、定義外の値を拒否する", async () => {
    await db.prepare("INSERT INTO allergens (id, name) VALUES ('wheat', '小麦')").run();
    await db.prepare("INSERT INTO menu_item_allergens (menu_item_id, allergen_id) VALUES ('ramen', 'wheat')").run();
    await db.prepare("INSERT INTO stocks (menu_item_id, quantity, updated_at) VALUES ('ramen', 10, 1000)").run();
    await db
      .prepare(
        "INSERT INTO orders (id, business_date, order_number, request_id, total_amount, handed_off_at, cancelled_at, confirmed_at, updated_at) VALUES ('order-1', '2026-10-24', 1, 'request-1', 500, NULL, NULL, 1000, 1000)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, cooking_state) VALUES ('order-1', 'ramen', 1, 500, 'unstarted')",
      )
      .run();

    await applyD1Migrations(db, [migration]);

    expect(await db.prepare("SELECT category FROM menu_items WHERE id = 'ramen'").first("category")).toBe("main");
    expect(
      (
        await db
          .prepare(
            "SELECT 'allergens' AS name, count(*) AS total FROM menu_item_allergens UNION ALL SELECT 'stocks', count(*) FROM stocks UNION ALL SELECT 'lines', count(*) FROM order_lines ORDER BY name",
          )
          .all()
      ).results,
    ).toEqual([
      { name: "allergens", total: 1 },
      { name: "lines", total: 1 },
      { name: "stocks", total: 1 },
    ]);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await expect(db.prepare("UPDATE menu_items SET category = 'invalid'").run()).rejects.toThrow();
    await expect(db.prepare("UPDATE menu_items SET allergen_check_state = 'invalid'").run()).rejects.toThrow();
  });
});
