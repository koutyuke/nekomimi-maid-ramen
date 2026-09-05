import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

const d1 = env.DB;

beforeEach(async () => {
  await d1.exec("DROP TABLE IF EXISTS spike_order_lines");
  await d1.exec("DROP TABLE IF EXISTS spike_orders");
  await d1.exec("DROP TABLE IF EXISTS spike_stocks");
  await d1.exec(
    "CREATE TABLE spike_stocks (menu_item_id TEXT PRIMARY KEY, quantity INTEGER NOT NULL, CONSTRAINT spike_non_negative CHECK (quantity >= 0))",
  );
  await d1.exec(
    "CREATE TABLE spike_orders (id TEXT PRIMARY KEY, business_date TEXT NOT NULL, order_number INTEGER NOT NULL, request_id TEXT NOT NULL)",
  );
  await d1.exec("CREATE UNIQUE INDEX spike_orders_number ON spike_orders (business_date, order_number)");
  await d1.exec("CREATE UNIQUE INDEX spike_orders_request ON spike_orders (request_id)");
  await d1.exec(
    "CREATE TABLE spike_order_lines (order_id TEXT NOT NULL, menu_item_id TEXT NOT NULL, quantity INTEGER NOT NULL)",
  );
  await d1.prepare("INSERT INTO spike_stocks (menu_item_id, quantity) VALUES (?, ?)").bind("ramen", 3).run();
});

const insertOrder = (id: string, requestId: string) =>
  d1
    .prepare(
      "INSERT INTO spike_orders (id, business_date, order_number, request_id) VALUES (?, ?, (SELECT COALESCE(MAX(order_number), 0) + 1 FROM spike_orders WHERE business_date = ?), ?)",
    )
    .bind(id, "2026-11-01", "2026-11-01", requestId);

const decrement = (quantity: number) =>
  d1.prepare("UPDATE spike_stocks SET quantity = quantity - ? WHERE menu_item_id = ?").bind(quantity, "ramen");

describe("D1バッチの前提", () => {
  it("CHECK制約違反でバッチ全体が巻き戻る", async () => {
    let failed: unknown = null;
    try {
      await d1.batch([
        insertOrder("order-1", "req-1"),
        d1
          .prepare("INSERT INTO spike_order_lines (order_id, menu_item_id, quantity) VALUES (?, ?, ?)")
          .bind("order-1", "ramen", 5),
        decrement(5),
      ]);
    } catch (error) {
      failed = error;
    }

    expect(failed).not.toBeNull();
    console.log("ERROR MESSAGE:", failed instanceof Error ? failed.message : String(failed));
    console.log("ERROR NAME:", failed instanceof Error ? failed.name : "n/a");
    console.log("ERROR CAUSE:", failed instanceof Error ? String(failed.cause) : "n/a");

    const orders = await d1.prepare("SELECT COUNT(*) AS c FROM spike_orders").first<{ c: number }>();
    const lines = await d1.prepare("SELECT COUNT(*) AS c FROM spike_order_lines").first<{ c: number }>();
    const stock = await d1.prepare("SELECT quantity AS q FROM spike_stocks").first<{ q: number }>();

    expect(orders?.c).toBe(0);
    expect(lines?.c).toBe(0);
    expect(stock?.q).toBe(3);
  });

  it("成功時は注文番号が1から連番になる", async () => {
    await d1.batch([insertOrder("order-1", "req-1"), decrement(1)]);
    await d1.batch([insertOrder("order-2", "req-2"), decrement(1)]);

    const rows = await d1
      .prepare("SELECT id, order_number FROM spike_orders ORDER BY order_number")
      .all<{ id: string; order_number: number }>();
    console.log("ROWS:", JSON.stringify(rows.results));
    expect(rows.results.map((row) => row.order_number)).toEqual([1, 2]);
  });

  it("失敗した確定は欠番を作らない", async () => {
    await d1.batch([insertOrder("order-1", "req-1"), decrement(1)]);
    await expect(d1.batch([insertOrder("order-x", "req-x"), decrement(99)])).rejects.toThrow();
    await d1.batch([insertOrder("order-2", "req-2"), decrement(1)]);

    const rows = await d1
      .prepare("SELECT order_number FROM spike_orders ORDER BY order_number")
      .all<{ order_number: number }>();
    expect(rows.results.map((row) => row.order_number)).toEqual([1, 2]);
  });

  it("在庫を超える同時確定を成立させない", async () => {
    const attempts = Array.from({ length: 6 }, (_, index) =>
      d1.batch([insertOrder(`order-${index}`, `req-${index}`), decrement(1)]).then(
        () => "ok" as const,
        () => "ng" as const,
      ),
    );

    const results = await Promise.all(attempts);
    console.log("CONCURRENT RESULTS:", results.join(","));

    const stock = await d1.prepare("SELECT quantity AS q FROM spike_stocks").first<{ q: number }>();
    const orders = await d1.prepare("SELECT COUNT(*) AS c FROM spike_orders").first<{ c: number }>();
    const numbers = await d1.prepare("SELECT order_number FROM spike_orders ORDER BY order_number").all();
    console.log("STOCK:", stock?.q, "ORDERS:", orders?.c, "NUMBERS:", JSON.stringify(numbers.results));

    expect(stock?.q).toBeGreaterThanOrEqual(0);
    expect(orders?.c).toBe(3);
  });

  it("同じrequest_idの再送は一意制約で弾かれる", async () => {
    await d1.batch([insertOrder("order-1", "req-1"), decrement(1)]);
    let failed: unknown = null;
    try {
      await d1.batch([insertOrder("order-2", "req-1"), decrement(1)]);
    } catch (error) {
      failed = error;
    }
    console.log("DUP ERROR:", failed instanceof Error ? failed.message : String(failed));

    const orders = await d1.prepare("SELECT COUNT(*) AS c FROM spike_orders").first<{ c: number }>();
    const stock = await d1.prepare("SELECT quantity AS q FROM spike_stocks").first<{ q: number }>();
    expect(orders?.c).toBe(1);
    expect(stock?.q).toBe(2);
  });
});
