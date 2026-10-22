import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Layer, ManagedRuntime } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { realtimeMock, upgradeWebSocketMock } from "../../../testing";
import { createApp } from "../../bootstrap/create-app";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { MenuLayer } from "../../features/menu/layer";
import { OrdersLayer } from "../../features/orders/layer";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../features/staff/testing";

const db = drizzle(env.DB);
const origin = "https://staff.nekomimi-ramen.com";
const menu = MenuLayer.pipe(Layer.provide(realtimeMock));

const summary = async (businessDate: string, role: "Owner" | "Admin" | "Staff" | "None" | null = "Admin") => {
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      realtimeMock,
      menu,
      OrdersLayer.pipe(Layer.provide(Layer.mergeAll(menu, realtimeMock))),
      authenticationGatewayMock(role ? { ...staffFixture, role } : null),
      staffRepositoryMock(),
    ).pipe(Layer.provide(makeDatabaseLive(env.DB))),
  );
  try {
    return await createApp({ origin, aot: false, upgradeWebSocket: upgradeWebSocketMock, runtime }).handle(
      new Request(`https://api.nekomimi-ramen.com/staff/sales-summary?businessDate=${businessDate}`, {
        headers: { origin },
      }),
    );
  } finally {
    await runtime.dispose();
  }
};

beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  const now = new Date();
  await db.insert(Database.tables.menuItems).values([
    { id: "ramen", name: "ラーメン", price: 500, category: "main", displayOrder: 1, updatedAt: now },
    { id: "gyoza", name: "餃子", price: 300, category: "side", displayOrder: 2, updatedAt: now },
    { id: "tea", name: "お茶", price: 200, category: "drink", displayOrder: 3, updatedAt: now },
  ]);
  const order = (id: string, businessDate: string, orderNumber: number, totalAmount: number) => ({
    id,
    requestId: `request-${id}`,
    businessDate,
    orderNumber,
    totalAmount,
    confirmedAt: now,
    updatedAt: now,
  });
  await db
    .insert(Database.tables.orders)
    .values([
      order("order-1", "2026-10-24", 1, 1200),
      { ...order("order-2", "2026-10-24", 2, 500), cancelledAt: now, cancelledBy: staffFixture.id },
      order("order-3", "2026-10-24", 3, 450),
      order("order-4", "2026-10-25", 1, 600),
    ]);
  await db.insert(Database.tables.orderLines).values([
    { orderId: "order-1", menuItemId: "ramen", quantity: 2, unitPrice: 500 },
    { orderId: "order-1", menuItemId: "tea", quantity: 1, unitPrice: 200 },
    { orderId: "order-2", menuItemId: "ramen", quantity: 1, unitPrice: 500 },
    // 価格変更前に確定した注文。現在価格ではなく確定時の単価で集計されることを確かめる。
    { orderId: "order-3", menuItemId: "ramen", quantity: 1, unitPrice: 450 },
    { orderId: "order-4", menuItemId: "tea", quantity: 3, unitPrice: 200 },
  ]);
});

describe("SPEC-SAL-008 営業日ごとの売上", () => {
  it("未取消の注文だけを確定時の単価で集計し、販売数0個の商品も表示順に返す", async () => {
    const response = await summary("2026-10-24");
    expect(response.status).toBe(200);
    const [revision] = await db
      .select()
      .from(Database.tables.resourceRevisions)
      .where(eq(Database.tables.resourceRevisions.scope, "orders"));
    expect(await response.json()).toEqual({
      revision: revision!.revision,
      orderCount: 2,
      totalAmount: 1650,
      items: [
        { menuItemId: "ramen", name: "ラーメン", quantity: 3, amount: 1450 },
        { menuItemId: "gyoza", name: "餃子", quantity: 0, amount: 0 },
        { menuItemId: "tea", name: "お茶", quantity: 1, amount: 200 },
      ],
    });
  });

  it("注文のない営業日は0件・0円を返す", async () => {
    expect(await (await summary("2026-10-26")).json()).toMatchObject({
      orderCount: 0,
      totalAmount: 0,
      items: [
        { menuItemId: "ramen", quantity: 0, amount: 0 },
        { menuItemId: "gyoza", quantity: 0, amount: 0 },
        { menuItemId: "tea", quantity: 0, amount: 0 },
      ],
    });
  });

  it("Ownerは取得できる", async () => {
    expect((await summary("2026-10-24", "Owner")).status).toBe(200);
  });

  it.each([
    ["Staff", 403],
    ["None", 403],
    [null, 401],
  ] as const)("%sは売上を取得できない", async (role, status) => {
    const response = await summary("2026-10-24", role);
    expect(response.status).toBe(status);
    expect(await response.json()).not.toHaveProperty("totalAmount");
  });
});
