import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Layer, ManagedRuntime } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../app";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { MenuLayer } from "../../features/menu/layer";
import { makeOrdersLayer } from "../../features/orders/layer";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../features/staff/testing";

const db = drizzle(env.DB);

const OrdersLayer = makeOrdersLayer("").pipe(Layer.provide(MenuLayer));
const AppLayer = Layer.mergeAll(
  MenuLayer,
  OrdersLayer,
  authenticationGatewayMock(staffFixture),
  staffRepositoryMock(),
).pipe(Layer.provide(makeDatabaseLive(env.DB)));

const app = createApp({
  origin: "https://staff.nekomimi-ramen.com",
  runtime: ManagedRuntime.make(AppLayer),
  aot: false,
});

const confirm = (body: unknown) =>
  app.handle(
    new Request("https://api.nekomimi-ramen.com/orders", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://staff.nekomimi-ramen.com" },
      body: JSON.stringify(body),
    }),
  );

const listMenu = () => app.handle(new Request("https://api.nekomimi-ramen.com/menu"));

// `wrangler d1 execute --file`と違い`D1Database.exec`は1行1文しか受け付けないため、投入SQLを文ごとに分けて渡す。
// ponytail: 文字列リテラルに`;`を書かない前提の素朴な分割。必要になったらSQLパーサへ差し替える。
const seed = () =>
  env.DB.batch(
    env.TEST_SEED_SQL.replace(/^\s*--.*$/gm, "")
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement !== "")
      .map((statement) => env.DB.prepare(statement)),
  );

const storedOrders = () => db.select().from(Database.tables.orders).all();
const stockOf = async (menuItemId: string) =>
  (await db.select().from(Database.tables.stocks).all()).find((row) => row.menuItemId === menuItemId)?.quantity;

beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.insert(Database.tables.menuItems).values({
    id: "item-ramen",
    name: "ラーメン",
    description: null,
    price: 500,
    category: "main",
    displayOrder: 1,
    allergenCheckState: "unchecked",
    updatedAt: new Date(),
  });
  await db.insert(Database.tables.stocks).values({ menuItemId: "item-ramen", quantity: 3, updatedAt: new Date() });
});

describe("SPEC-SAL-005 実際のD1を通した注文確定", () => {
  it("確定すると注文が1件保存され、在庫が確定した数量だけ減る", async () => {
    const response = await confirm({ requestId: "request-1", lines: [{ menuItemId: "item-ramen", quantity: 2 }] });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ orderNumber: 1, totalAmount: 1000 });
    expect(await storedOrders()).toHaveLength(1);
    expect(await stockOf("item-ramen")).toBe(1);
  });

  it("同じ確定要求を再送しても注文が増えず、在庫も二重に減らない", async () => {
    const first = await confirm({ requestId: "request-1", lines: [{ menuItemId: "item-ramen", quantity: 1 }] });
    const resent = await confirm({ requestId: "request-1", lines: [{ menuItemId: "item-ramen", quantity: 1 }] });

    expect(await first.json()).toMatchObject({ orderNumber: 1 });
    expect(await resent.json()).toMatchObject({ orderNumber: 1 });
    expect(await storedOrders()).toHaveLength(1);
    expect(await stockOf("item-ramen")).toBe(2);
  });

  it("在庫を超える確定を409で拒否し、注文も在庫も変えない", async () => {
    const response = await confirm({ requestId: "request-1", lines: [{ menuItemId: "item-ramen", quantity: 5 }] });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "out_of_stock",
      shortages: [{ menuItemId: "item-ramen", requested: 5, available: 3 }],
    });
    expect(await storedOrders()).toHaveLength(0);
    expect(await stockOf("item-ramen")).toBe(3);
  });

  it("在庫数を超える同時確定の合計が在庫数を超えない", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        confirm({ requestId: `request-${index}`, lines: [{ menuItemId: "item-ramen", quantity: 1 }] }),
      ),
    );

    expect(responses.filter((response) => response.status === 201)).toHaveLength(3);
    expect(await storedOrders()).toHaveLength(3);
    expect(await stockOf("item-ramen")).toBe(0);
  });
});

describe("SPEC-VIS-001 実際のD1を通したメニューの販売可否", () => {
  it("在庫ありだけを販売可能とし、在庫0と在庫記録なしは販売不可にする", async () => {
    await db.insert(Database.tables.menuItems).values([
      {
        id: "item-zero-stock",
        name: "餃子",
        description: null,
        price: 400,
        category: "side",
        displayOrder: 2,
        allergenCheckState: "unchecked",
        updatedAt: new Date(),
      },
      {
        id: "item-missing-stock",
        name: "お茶",
        description: null,
        price: 200,
        category: "drink",
        displayOrder: 3,
        allergenCheckState: "unchecked",
        updatedAt: new Date(),
      },
    ]);
    await db
      .insert(Database.tables.stocks)
      .values({ menuItemId: "item-zero-stock", quantity: 0, updatedAt: new Date() });

    const response = await listMenu();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      items: [
        { id: "item-ramen", sellable: true },
        { id: "item-zero-stock", sellable: false },
        { id: "item-missing-stock", sellable: false },
      ],
    });
  });
});

describe("SPEC-VIS-002 投入したメニューの取得", () => {
  beforeEach(async () => {
    await db.delete(Database.tables.stocks);
    await db.delete(Database.tables.menuItems);
    await seed();
  });

  it("6商品を表示順で返し、すべて販売可能かつ特定原材料は未確認である", async () => {
    const response = await listMenu();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [
        { id: "item-ramen", name: "ラーメン", price: 500, category: "main" },
        { id: "item-gyoza", name: "餃子", price: 400, category: "side" },
        { id: "item-cola", name: "コーラ", price: 300, category: "drink" },
        { id: "item-orange-juice", name: "オレンジジュース", price: 300, category: "drink" },
        { id: "item-ginger-ale", name: "ジンジャーエール", price: 300, category: "drink" },
        { id: "item-oolong-tea", name: "烏龍茶", price: 300, category: "drink" },
      ].map((item) => ({
        ...item,
        description: null,
        sellable: true,
        allergenCheckState: "unchecked",
        containedAllergens: [],
      })),
    });
  });

  it("特定原材料の9品目を登録する", async () => {
    const allergens = await db.select().from(Database.tables.allergens).all();

    expect(allergens.map((allergen) => allergen.name).toSorted()).toEqual(
      ["えび", "かに", "カシューナッツ", "くるみ", "小麦", "そば", "卵", "乳", "落花生"].toSorted(),
    );
  });

  it("二度投入しても商品が重複せず、減った在庫も戻らない", async () => {
    await db
      .update(Database.tables.stocks)
      .set({ quantity: 7 })
      .where(eq(Database.tables.stocks.menuItemId, "item-ramen"));

    await seed();

    expect(await db.select().from(Database.tables.menuItems).all()).toHaveLength(6);
    expect(await stockOf("item-ramen")).toBe(7);
  });
});
