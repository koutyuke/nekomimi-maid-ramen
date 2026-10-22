import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { Database, makeDatabaseLive } from "../../../../../core/infra/drizzle";
import { MenuItemRepository } from "../../../application/ports/outbound/menu-item.repository";
import { MenuItemRepositoryLive } from "../menu-item.repository.live";
import type { MenuCategory } from "../../../domain/menu-item";

const db = drizzle(env.DB);

const listMenu = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* MenuItemRepository;
      const snapshot = yield* repository.findMany();
      return snapshot.data.map(({ menuItem, quantity }) => [menuItem.name, quantity]);
    }).pipe(Effect.provide(MenuItemRepositoryLive.pipe(Layer.provide(makeDatabaseLive(env.DB))))),
  );

const menuItemRow = (args: {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
  category: MenuCategory;
}) => ({
  ...args,
  updatedAt: new Date(),
});

const insertMenuItem = (category: string) =>
  env.DB.prepare(
    "INSERT INTO menu_items (id, name, price, category, display_order, updated_at) VALUES ('item-ramen', 'ラーメン', 500, ?, 1, 1000)",
  )
    .bind(category)
    .run();

beforeEach(async () => {
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
});

describe("SPEC-INV-001 商品と在庫残数の読み出し", () => {
  it("定義外の分類を保存しない", async () => {
    await expect(insertMenuItem("invalid")).rejects.toThrow();
  });

  it("表示順で並べ、各商品へ自身の在庫残数を対応させる", async () => {
    await db
      .insert(Database.tables.menuItems)
      .values([
        menuItemRow({ id: "item-cola", name: "コーラ", price: 300, displayOrder: 3, category: "drink" }),
        menuItemRow({ id: "item-gyoza", name: "餃子", price: 400, displayOrder: 2, category: "side" }),
        menuItemRow({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1, category: "main" }),
      ]);
    await db.insert(Database.tables.stocks).values([
      { menuItemId: "item-cola", quantity: 3, updatedAt: new Date() },
      { menuItemId: "item-ramen", quantity: 1, updatedAt: new Date() },
    ]);

    expect(await listMenu()).toEqual([
      ["ラーメン", 1],
      ["餃子", 0],
      ["コーラ", 3],
    ]);
  });
});
