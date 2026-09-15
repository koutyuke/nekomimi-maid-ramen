import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { MenuItemId } from "../../../../../core/domain/ids";
import { Database, makeDatabaseLive } from "../../../../../core/infra/drizzle";
import { StockRepository } from "../../../application/ports/outbound/stock.repository";
import { StockQuantity } from "../../../domain/stock";
import { StockRepositoryLive } from "../stock.repository.live";

const db = drizzle(env.DB);
const itemId = MenuItemId.make("ramen");
const adjust = (quantity: number) =>
  Effect.runPromise(
    Effect.flatMap(StockRepository, (repository) =>
      repository.adjust("admin", itemId, StockQuantity.make(quantity)),
    ).pipe(Effect.either, Effect.provide(StockRepositoryLive.pipe(Layer.provide(makeDatabaseLive(env.DB))))),
  );
const snapshot = async () => ({
  stocks: await db.select().from(Database.tables.stocks),
  adjustments: await db.select().from(Database.tables.stockAdjustments),
  revisions: await db.select().from(Database.tables.resourceRevisions),
});

beforeEach(async () => {
  await db.delete(Database.tables.stockAdjustments);
  await db.delete(Database.tables.menuItems);
  await db.delete(Database.tables.users);
  await db.insert(Database.tables.menuItems).values({
    id: itemId,
    name: "ラーメン",
    price: 500,
    category: "main",
    displayOrder: 1,
    allergenCheckState: "unchecked",
    updatedAt: new Date(),
  });
  await db.insert(Database.tables.users).values({
    id: "admin",
    email: "admin@example.com",
    name: "管理者",
    role: "Admin",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(Database.tables.stocks).values({ menuItemId: itemId, quantity: 3, updatedAt: new Date() });
});

describe("SPEC-INV-004 SPEC-SYS-009 在庫修正の原子性と履歴", () => {
  it("在庫更新が失敗した場合は履歴とリビジョンも取り消す", async () => {
    const before = await snapshot();
    await env.DB.prepare(
      "CREATE TRIGGER fail_stock_adjustment BEFORE UPDATE ON stocks BEGIN SELECT RAISE(ABORT, 'forced failure'); END",
    ).run();
    try {
      const result = await adjust(8);
      expect(result).toMatchObject({ _tag: "Left", left: { _tag: "PersistenceError" } });
      expect(await snapshot()).toEqual(before);
    } finally {
      await env.DB.prepare("DROP TRIGGER fail_stock_adjustment").run();
    }
  });

  it("同時修正でもそれぞれが実際に上書きした直前の数量を履歴に残す", async () => {
    const results = await Promise.all([adjust(8), adjust(9)]);
    const adjustments = results.map((result) => {
      expect(result._tag).toBe("Right");
      if (result._tag === "Left") {
        throw new Error("修正に失敗した");
      }
      return result.right;
    });
    const first = adjustments.find((adjustment) => adjustment.previousQuantity === 3)!;
    const second = adjustments.find((adjustment) => adjustment.id !== first.id)!;
    expect(second.previousQuantity).toBe(first.quantity);
    expect((await snapshot()).stocks[0]?.quantity).toBe(second.quantity);
    expect((await snapshot()).adjustments).toHaveLength(2);
  });
});
