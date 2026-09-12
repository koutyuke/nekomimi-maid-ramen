import { applyD1Migrations, env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";

import { Database } from "../../core/infra/drizzle";

const db = drizzle(env.DB);
const revisions = async () => {
  const rows = await db.select().from(Database.tables.resourceRevisions);
  return {
    menu: rows.find((row) => row.scope === "menu")!.revision,
    orders: rows.find((row) => row.scope === "orders")!.revision,
  };
};

beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.insert(Database.tables.menuItems).values({
    id: "ramen",
    name: "ラーメン",
    price: 500,
    category: "main",
    displayOrder: 1,
    allergenCheckState: "unchecked",
    updatedAt: new Date(),
  });
  await db.insert(Database.tables.stocks).values({ menuItemId: "ramen", quantity: 10, updatedAt: new Date() });
  await db.insert(Database.tables.orders).values({
    id: "order",
    requestId: "request",
    businessDate: "2026-10-24",
    orderNumber: 1,
    totalAmount: 500,
    confirmedAt: new Date(),
    updatedAt: new Date(),
  });
  await db
    .insert(Database.tables.orderLines)
    .values({ orderId: "order", menuItemId: "ramen", quantity: 1, unitPrice: 500 });
});

describe("SPEC-SYS-009 SPEC-INV-003 保存とリビジョンの原子性", () => {
  it("適用済みの更新番号を行形式へ引き継ぎ、移行後の更新でも番号を進める", async () => {
    const migrationDb = env.MIGRATION_DB;
    await applyD1Migrations(
      migrationDb,
      env.TEST_MIGRATIONS.filter((entry) => entry.name < "0007"),
    );
    await migrationDb.prepare("UPDATE sync_versions SET menu = 42, orders = 71 WHERE id = 1").run();
    await applyD1Migrations(
      migrationDb,
      env.TEST_MIGRATIONS.filter((entry) => entry.name.startsWith("0007")),
    );
    expect((await migrationDb.prepare("SELECT * FROM resource_revisions ORDER BY scope").all()).results).toEqual([
      { scope: "menu", revision: 42 },
      { scope: "orders", revision: 71 },
    ]);
    await migrationDb
      .prepare(
        "INSERT INTO menu_items (id, name, price, category, display_order, allergen_check_state, updated_at) VALUES ('ramen', 'ラーメン', 500, 'main', 1, 'unchecked', 1000)",
      )
      .run();
    expect(
      await migrationDb.prepare("SELECT revision FROM resource_revisions WHERE scope = 'menu'").first("revision"),
    ).toBe(43);
  });

  it("販売中のまま残数だけが変わってもメニューのリビジョンを進め、注文のリビジョンは変えない", async () => {
    const before = await revisions();
    await db.update(Database.tables.stocks).set({ quantity: 9 });
    expect(await revisions()).toEqual({ menu: before.menu + 1, orders: before.orders });
    await db.update(Database.tables.stocks).set({ quantity: 9, updatedAt: new Date() });
    expect(await revisions()).toEqual({ menu: before.menu + 1, orders: before.orders });
  });

  it("調理と受け渡しの変更は注文だけを進め、成立しなかった更新では進めない", async () => {
    const before = await revisions();
    await db.update(Database.tables.orderLines).set({ cookingState: "cooking" });
    await db.update(Database.tables.orders).set({ handedOffAt: new Date() });
    const changed = await revisions();
    expect(changed.menu).toBe(before.menu);
    expect(changed.orders).toBe(before.orders + 2);
    await db
      .update(Database.tables.orderLines)
      .set({ cookingState: "completed" })
      .where(eq(Database.tables.orderLines.orderId, "missing"));
    expect(await revisions()).toEqual(changed);
  });

  it("在庫不足でバッチが失敗すると注文状態もリビジョンも戻る", async () => {
    const before = await revisions();
    await expect(
      db.batch([
        db.update(Database.tables.orderLines).set({ cookingState: "cooking" }),
        db.update(Database.tables.stocks).set({ quantity: -1 }),
      ]),
    ).rejects.toThrow();
    expect(await revisions()).toEqual(before);
    expect((await db.select().from(Database.tables.orderLines))[0]?.cookingState).toBe("unstarted");
  });

  it("取消と在庫復元を同時に保存すると、両方の照合範囲で変更を検出できる", async () => {
    const before = await revisions();
    // 取消の業務APIは別の作業で実装するため、保存境界の更新を再現する。
    await db.batch([
      db.update(Database.tables.orders).set({ cancelledAt: new Date() }),
      db.update(Database.tables.stocks).set({ quantity: 11 }),
    ]);
    expect(await revisions()).toEqual({ menu: before.menu + 1, orders: before.orders + 1 });
  });

  it("注文一覧が参照する商品名の変更は、メニューと注文の両方を進める", async () => {
    const before = await revisions();
    await db.update(Database.tables.menuItems).set({ name: "塩ラーメン" });
    expect(await revisions()).toEqual({ menu: before.menu + 1, orders: before.orders + 1 });
  });
});
