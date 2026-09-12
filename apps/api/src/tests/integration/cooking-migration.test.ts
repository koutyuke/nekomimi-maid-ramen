import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

const db = env.MIGRATION_DB;
const migration = env.TEST_MIGRATIONS.find((entry) => entry.name === "0004_line_cooking_handoff.sql")!;

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
    env.TEST_MIGRATIONS.filter((entry) => entry.name < "0004"),
  );
  await db
    .prepare(
      "INSERT INTO menu_items (id, name, price, category, display_order, allergen_check_state, updated_at) VALUES ('ramen', 'ラーメン', 500, 'main', 1, 'unchecked', 1000), ('tea', '烏龍茶', 200, 'drink', 2, 'unchecked', 1000)",
    )
    .run();
  await db.batch(
    ["unstarted", "cooking", "completed"].flatMap((state, index) => [
      db
        .prepare(
          "INSERT INTO orders (id, business_date, order_number, request_id, total_amount, cooking_state, cancelled_at, confirmed_at, updated_at) VALUES (?, '2026-10-24', ?, ?, 1200, ?, ?, 1000, 2000)",
        )
        .bind(`order-${index}`, index + 1, `request-${index}`, state, index === 1 ? 1500 : null),
      db
        .prepare(
          "INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price) VALUES (?, 'ramen', 2, 500), (?, 'tea', 1, 200)",
        )
        .bind(`order-${index}`, `order-${index}`),
    ]),
  );
});

describe("SPEC-KIT-002 SPEC-HAND-002 調理状態と受け渡し日時の移行", () => {
  it("不正な旧状態を検出したら移行を取り消し、元の注文と明細を残す", async () => {
    await db.prepare("UPDATE orders SET cooking_state = 'invalid' WHERE id = 'order-0'").run();
    await expect(applyD1Migrations(db, [migration])).rejects.toThrow();
    expect(await db.prepare("SELECT cooking_state FROM orders WHERE id = 'order-0'").first("cooking_state")).toBe(
      "invalid",
    );
    expect((await db.prepare("SELECT * FROM order_lines").all()).results).toHaveLength(6);
    const { results: columns } = await db.prepare("PRAGMA table_info(order_lines)").all<{ name: string }>();
    expect(columns.some((column) => column.name === "cooking_state")).toBe(false);
  });
  it("全状態を各明細へ引き継ぎ、注文・明細・取消・金額と外部キーを保持する", async () => {
    expect(migration).toBeDefined();
    await applyD1Migrations(db, [migration]);
    const { results: lines } = await db.prepare("SELECT * FROM order_lines ORDER BY order_id, menu_item_id").all();
    expect(lines).toEqual(
      ["unstarted", "cooking", "completed"].flatMap((state, index) => [
        { order_id: `order-${index}`, menu_item_id: "ramen", quantity: 2, unit_price: 500, cooking_state: state },
        { order_id: `order-${index}`, menu_item_id: "tea", quantity: 1, unit_price: 200, cooking_state: state },
      ]),
    );
    const { results: orders } = await db.prepare("SELECT * FROM orders ORDER BY id").all();
    expect(orders).toEqual(
      [0, 1, 2].map((index) => ({
        id: `order-${index}`,
        business_date: "2026-10-24",
        order_number: index + 1,
        request_id: `request-${index}`,
        total_amount: 1200,
        cancelled_at: index === 1 ? 1500 : null,
        handed_off_at: null,
        confirmed_at: 1000,
        updated_at: 2000,
      })),
    );
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await expect(db.prepare("UPDATE order_lines SET cooking_state = 'invalid'").run()).rejects.toThrow();
    // 移行後も、注文の削除だけがその明細を連鎖削除する。
    await db.prepare("DELETE FROM orders WHERE id = 'order-0'").run();
    expect((await db.prepare("SELECT * FROM order_lines").all()).results).toHaveLength(4);
  });

  it("調理状態を移す処理は既存の受け渡し日時を保持する", async () => {
    // 日時列の追加後に記録がある場合も、残りの移行で注文を作り直さず保持する。
    await db.prepare(migration.queries[0]!).run();
    await db.prepare("UPDATE orders SET handed_off_at = 1700 WHERE id = 'order-2'").run();
    await db.batch(migration.queries.slice(1).map((query) => db.prepare(query)));
    expect(await db.prepare("SELECT handed_off_at FROM orders WHERE id = 'order-2'").first("handed_off_at")).toBe(1700);
    expect(
      (await db.prepare("SELECT * FROM order_lines WHERE order_id = 'order-2' AND cooking_state = 'completed'").all())
        .results,
    ).toHaveLength(2);
  });
});
