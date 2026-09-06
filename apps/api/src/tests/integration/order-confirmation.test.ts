import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Layer, ManagedRuntime } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../app";
import { databaseLayer } from "../../core/infra/drizzle/database";
import { menuItems, orderLines, orders, stocks } from "../../core/infra/drizzle/schema";
import { InventoryLayer } from "../../features/inventory/layer";
import { SalesLayer } from "../../features/sales/layer";
import { VisitorInformationLayer } from "../../features/visitor-information/layer";
import { OrderConfirmationCommitLive } from "../../integrations/order-confirmation/order-confirmation.commit.live";

const db = drizzle(env.DB);

const VisitorWithInventoryLayer = VisitorInformationLayer.pipe(Layer.provide(InventoryLayer));
const InventoryAndVisitorLayer = Layer.mergeAll(InventoryLayer, VisitorWithInventoryLayer);
const SalesAndIntegrationLayer = Layer.mergeAll(SalesLayer, OrderConfirmationCommitLive).pipe(
  Layer.provide(InventoryAndVisitorLayer),
);
const AppLayer = Layer.mergeAll(InventoryAndVisitorLayer, SalesAndIntegrationLayer).pipe(
  Layer.provide(databaseLayer(env.DB)),
);

const app = createApp({
  origin: "https://nekomimi-ramen.com",
  runtime: ManagedRuntime.make(AppLayer),
  aot: false,
});

const confirm = (body: unknown) =>
  app.handle(
    new Request("https://api.nekomimi-ramen.com/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const listMenu = () => app.handle(new Request("https://api.nekomimi-ramen.com/menu"));

const storedOrders = () => db.select().from(orders).all();
const stockOf = async (menuItemId: string) =>
  (await db.select().from(stocks).all()).find((row) => row.menuItemId === menuItemId)?.quantity;

beforeEach(async () => {
  await db.delete(orderLines);
  await db.delete(orders);
  await db.delete(stocks);
  await db.delete(menuItems);
  await db.insert(menuItems).values({
    id: "item-ramen",
    name: "ラーメン",
    description: null,
    price: 500,
    category: "main",
    displayOrder: 1,
    allergenCheckState: "unchecked",
    updatedAt: new Date(),
  });
  await db.insert(stocks).values({ menuItemId: "item-ramen", quantity: 3, updatedAt: new Date() });
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
    await db.insert(menuItems).values([
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
    await db.insert(stocks).values({ menuItemId: "item-zero-stock", quantity: 0, updatedAt: new Date() });

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
