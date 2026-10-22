import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer, ManagedRuntime } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { upgradeWebSocketMock } from "../../../testing";
import { createApp } from "../../bootstrap/create-app";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { MenuLayer } from "../../features/menu/layer";
import { OrdersLayer as OrderServices } from "../../features/orders/layer";
import { UpdateNotifierFacade } from "../../features/realtime/public";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../features/staff/testing";
import type { Staff } from "../../features/staff/public";

const db = drizzle(env.DB);
const origin = "https://staff.nekomimi-ramen.com";
const admin: Staff = { ...staffFixture, id: "admin", role: "Admin" };
const notify = vi.fn(() => Effect.void);

const appFor = (staff: Staff | null) => {
  const notifier = Layer.succeed(UpdateNotifierFacade, { notify });
  const menu = MenuLayer.pipe(Layer.provide(notifier));
  const orders = OrderServices.pipe(Layer.provide(Layer.mergeAll(menu, notifier)));
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(notifier, menu, orders, authenticationGatewayMock(staff), staffRepositoryMock()).pipe(
      Layer.provide(makeDatabaseLive(env.DB)),
    ),
  );
  return createApp({ upgradeWebSocket: upgradeWebSocketMock, origin, runtime, aot: false });
};

const changePrice = (
  body: unknown,
  { staff = admin, menuItemId = "item-ramen" }: { staff?: Staff | null; menuItemId?: string } = {},
) =>
  appFor(staff).handle(
    new Request(`https://api.nekomimi-ramen.com/staff/menu/${menuItemId}/price`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    }),
  );

const confirm = (requestId: string) =>
  appFor({ ...staffFixture }).handle(
    new Request("https://api.nekomimi-ramen.com/staff/orders", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ requestId, lines: [{ menuItemId: "item-ramen", quantity: 2 }] }),
    }),
  );

const ramen = () =>
  db.select().from(Database.tables.menuItems).where(eq(Database.tables.menuItems.id, "item-ramen")).get();
const menuRevision = async () =>
  (
    await db
      .select()
      .from(Database.tables.resourceRevisions)
      .where(eq(Database.tables.resourceRevisions.scope, "menu"))
      .get()
  )?.revision;

const insertUser = (id: string, role: Staff["role"]) =>
  db.insert(Database.tables.users).values({
    id,
    email: `${id}@gm.ibaraki-ct.ac.jp`,
    name: id,
    role,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

beforeEach(async () => {
  notify.mockClear();
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.delete(Database.tables.users);
  await insertUser("admin", "Admin");
  await db.insert(Database.tables.menuItems).values({
    id: "item-ramen",
    name: "ラーメン",
    price: 600,
    category: "main",
    displayOrder: 1,
    updatedAt: new Date("2026-10-31T00:00:00Z"),
  });
  await db.insert(Database.tables.stocks).values({ menuItemId: "item-ramen", quantity: 10, updatedAt: new Date() });
});

describe("SPEC-SAL-007 実際のD1を通した価格変更", () => {
  it.each(["Admin", "Owner"] as const)(
    "%sが価格を変えると、リビジョンを進めて通知し、変更後の価格を返す",
    async (role) => {
      await db.update(Database.tables.users).set({ role });
      const before = await menuRevision();

      const response = await changePrice({ price: 650 }, { staff: { ...admin, role } });

      expect(response.status).toBe(200);
      const stored = await ramen();
      expect(await response.json()).toEqual({
        menuItemId: "item-ramen",
        price: 650,
        updatedAt: stored?.updatedAt.toISOString(),
      });
      expect(stored?.price).toBe(650);
      expect(await menuRevision()).toBe(before! + 1);
      expect(notify).toHaveBeenCalledExactlyOnceWith(["menu"]);
    },
  );

  it("同じ価格への変更は200を返し、更新日時・リビジョン・通知を変えない", async () => {
    const before = { item: await ramen(), revision: await menuRevision() };

    const response = await changePrice({ price: 600 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      menuItemId: "item-ramen",
      price: 600,
      updatedAt: "2026-10-31T00:00:00.000Z",
    });
    expect(await ramen()).toEqual(before.item);
    expect(await menuRevision()).toBe(before.revision);
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([0, -100, 650.5, "650", null])("価格 %j を422で拒否し、価格を変えない", async (price) => {
    const response = await changePrice({ price });

    expect(response.status).toBe(422);
    expect((await ramen())?.price).toBe(600);
    expect(notify).not.toHaveBeenCalled();
  });

  it("存在しない商品を404で拒否する", async () => {
    const response = await changePrice({ price: 650 }, { menuItemId: "item-missing" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "menu_item_not_found" });
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([
    ["Staff", 403],
    ["None", 403],
    [null, 401],
  ] as const)("%sの変更を%iで拒否し、価格を変えない", async (role, status) => {
    const response = await changePrice({ price: 650 }, { staff: role === null ? null : { ...admin, role } });

    expect(response.status).toBe(status);
    expect((await ramen())?.price).toBe(600);
  });

  it("保存時にDBのロールがAdmin未満なら403で拒否し、価格を変えない", async () => {
    // セッションの確認後、保存までの間にロールを剥奪された状態を再現する。
    await db.update(Database.tables.users).set({ role: "Staff" });

    const response = await changePrice({ price: 650 });

    expect(response.status).toBe(403);
    expect((await ramen())?.price).toBe(600);
    expect(notify).not.toHaveBeenCalled();
  });

  it("変更後の注文には新しい価格を適用し、確定済み注文の単価と合計金額は変えない", async () => {
    await confirm("before-change");
    await changePrice({ price: 650 });
    await confirm("after-change");

    const orders = await db.select().from(Database.tables.orders).orderBy(Database.tables.orders.orderNumber);
    const lines = await db.select().from(Database.tables.orderLines);
    expect(orders.map(({ requestId, totalAmount }) => ({ requestId, totalAmount }))).toEqual([
      { requestId: "before-change", totalAmount: 1200 },
      { requestId: "after-change", totalAmount: 1300 },
    ]);
    expect(lines.find((line) => line.orderId === orders[0]!.id)?.unitPrice).toBe(600);
    expect(lines.find((line) => line.orderId === orders[1]!.id)?.unitPrice).toBe(650);
  });
});
