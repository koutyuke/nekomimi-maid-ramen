import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Layer, ManagedRuntime, Schema } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { realtimeMock, upgradeWebSocketMock } from "../../../testing";
import { createApp } from "../../bootstrap/create-app";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { MenuLayer } from "../../features/menu/layer";
import { makeOrdersLayer } from "../../features/orders/layer";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../features/staff/testing";

const db = drizzle(env.DB);
const origin = "https://staff.nekomimi-ramen.com";
const menu = MenuLayer.pipe(Layer.provide(realtimeMock));
const request = async (
  path: string,
  role: "Admin" | "Owner" | "Staff" | "None" | null = "Admin",
  method = "POST",
  requestOrigin = origin,
  body?: unknown,
) => {
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      realtimeMock,
      menu,
      makeOrdersLayer(staffFixture.email).pipe(Layer.provide(Layer.mergeAll(menu, realtimeMock))),
      authenticationGatewayMock(role ? { ...staffFixture, role } : null),
      staffRepositoryMock(),
    ).pipe(Layer.provide(makeDatabaseLive(env.DB))),
  );
  try {
    return await createApp({ origin, aot: false, upgradeWebSocket: upgradeWebSocketMock, runtime }).handle(
      new Request(`https://api.nekomimi-ramen.com${path}`, {
        method,
        headers: { origin: requestOrigin, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  } finally {
    await runtime.dispose();
  }
};
const cancel = (role: "Admin" | "Owner" | "Staff" | "None" | null = "Admin", id = "order-1") =>
  request(`/staff/orders/${id}/cancel`, role);
const snapshot = async () => ({
  orders: await db.select().from(Database.tables.orders),
  stocks: await db.select().from(Database.tables.stocks).orderBy(Database.tables.stocks.menuItemId),
  revisions: await db.select().from(Database.tables.resourceRevisions).orderBy(Database.tables.resourceRevisions.scope),
});

beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.delete(Database.tables.users);
  const now = new Date();
  // 認証時と保存時の判定を分け、Ownerはメールアドレスから判定する。
  await db.insert(Database.tables.users).values({
    ...staffFixture,
    email: "admin@gm.ibaraki-ct.ac.jp",
    role: "Admin",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(Database.tables.menuItems).values([
    {
      id: "ramen",
      name: "ラーメン",
      price: 500,
      category: "main",
      displayOrder: 1,
      allergenCheckState: "unchecked",
      updatedAt: now,
    },
    {
      id: "tea",
      name: "お茶",
      price: 200,
      category: "drink",
      displayOrder: 2,
      allergenCheckState: "unchecked",
      updatedAt: now,
    },
  ]);
  await db.insert(Database.tables.stocks).values([
    { menuItemId: "ramen", quantity: 8, updatedAt: now },
    { menuItemId: "tea", quantity: 0, updatedAt: now },
  ]);
  await db.insert(Database.tables.orders).values({
    id: "order-1",
    requestId: "request-1",
    businessDate: "2026-10-24",
    orderNumber: 1,
    totalAmount: 1600,
    confirmedAt: now,
    updatedAt: now,
  });
  await db.insert(Database.tables.orderLines).values([
    { orderId: "order-1", menuItemId: "ramen", quantity: 2, unitPrice: 500 },
    { orderId: "order-1", menuItemId: "tea", quantity: 3, unitPrice: 200 },
  ]);
});

describe("SPEC-SAL-006 SPEC-SYS-006 注文取消と在庫復元", () => {
  it.each(["unstarted", "cooking"] as const)(
    "%sでも取り消し、全明細の数量を在庫へ戻して業務一覧から除外する",
    async (state) => {
      await db.update(Database.tables.orderLines).set({ cookingState: state });
      const handedOffAt = null;
      await db.update(Database.tables.orders).set({ handedOffAt });
      const before = await snapshot();
      const response = await cancel();
      expect(response.status).toBe(200);
      const result = Schema.decodeUnknownSync(
        Schema.Struct({ id: Schema.String, cancelledAt: Schema.String, cancelledBy: Schema.String }),
      )(await response.json());
      const after = await snapshot();
      expect(after.orders[0]).toMatchObject({
        id: "order-1",
        cancelledBy: staffFixture.id,
        cancelledAt: new Date(result.cancelledAt),
        handedOffAt,
      });
      expect(result.cancelledBy).toBe(staffFixture.id);
      expect(after.stocks.map(({ quantity }) => quantity)).toEqual([10, 3]);
      expect(after.revisions.every((row, index) => row.revision > before.revisions[index]!.revision)).toBe(true);
      expect(await (await request("/staff/orders?businessDate=2026-10-24", "Staff", "GET")).json()).toMatchObject({
        orders: [],
      });
      expect((await request("/staff/orders/order-1/handoff", "Staff")).status).toBe(409);
    },
  );

  it("Staffも保存時の権限を満たして取り消せる", async () => {
    await db.update(Database.tables.users).set({ role: "Staff" });
    expect((await cancel("Staff")).status).toBe(200);
  });

  it.each(["ramen", "tea", "handoff"])("%sの完成・受け渡し後には在庫も取消記録も変更しない", async (target) => {
    if (target === "handoff") {
      await db.update(Database.tables.orders).set({ handedOffAt: new Date() });
    } else {
      await db
        .update(Database.tables.orderLines)
        .set({ cookingState: "completed" })
        .where(eq(Database.tables.orderLines.menuItemId, target));
    }
    const before = await snapshot();
    expect((await cancel()).status).toBe(409);
    expect(await snapshot()).toEqual(before);
  });

  it("取消済みは指定した場合だけ一覧に残り、営業日の絞り込みは変わらない", async () => {
    expect((await cancel()).status).toBe(200);
    expect(
      await (await request("/staff/orders?businessDate=2026-10-24&includeCancelled=true", "Staff", "GET")).json(),
    ).toMatchObject({ orders: [{ id: "order-1", cancelledAt: expect.any(String) }] });
    expect(
      await (await request("/staff/orders?businessDate=2026-10-24&includeCancelled=false", "Staff", "GET")).json(),
    ).toMatchObject({ orders: [] });
    expect(
      await (await request("/staff/orders?businessDate=2026-10-25&includeCancelled=true", "Staff", "GET")).json(),
    ).toMatchObject({ orders: [] });
  });

  it("調理中の注文を取り消すと、完成も受け渡しも成立しない", async () => {
    await db.update(Database.tables.orderLines).set({ cookingState: "cooking" });
    expect((await cancel()).status).toBe(200);
    expect(
      (await request("/staff/orders/order-1/lines/ramen/cooking-state", "Staff", "PATCH", origin, { to: "completed" }))
        .status,
    ).toBe(409);
    expect((await request("/staff/orders/order-1/handoff", "Staff")).status).toBe(409);
    expect((await db.select().from(Database.tables.orderLines)).every((line) => line.cookingState === "cooking")).toBe(
      true,
    );
  });

  it("完成と取消が競合しても両方は成立しない", async () => {
    await db.update(Database.tables.orderLines).set({ cookingState: "cooking" });
    const responses = await Promise.all([
      cancel(),
      request("/staff/orders/order-1/lines/tea/cooking-state", "Staff", "PATCH", origin, { to: "completed" }),
    ]);
    expect(responses.map(({ status }) => status).toSorted((a, b) => a - b)).toEqual([200, 409]);
    const stored = await snapshot();
    expect(stored.stocks.map(({ quantity }) => quantity)).toEqual(stored.orders[0]?.cancelledAt ? [10, 3] : [8, 0]);
  });

  it("二端末の同時取消と再送でも一度だけ復元し、記録を上書きしない", async () => {
    const responses = await Promise.all([cancel(), cancel()]);
    expect(responses.map(({ status }) => status).toSorted((left, right) => left - right)).toEqual([200, 409]);
    const stored = await snapshot();
    expect(stored.stocks.map(({ quantity }) => quantity)).toEqual([10, 3]);
    expect((await cancel()).status).toBe(409);
    expect(await snapshot()).toEqual(stored);
  });

  it.each(["None", null] as const)("%sは取消と在庫復元を行えない", async (role) => {
    const before = await snapshot();
    expect((await cancel(role)).status).toBe(role === null ? 401 : 403);
    expect(await snapshot()).toEqual(before);
  });

  it("Ownerは保存済みロールがNoneでも取り消せる", async () => {
    await db.update(Database.tables.users).set({ role: "None", email: staffFixture.email });
    expect((await cancel("Owner")).status).toBe(200);
  });

  it("保存前の権限喪失と存在しない注文では何も変更しない", async () => {
    const before = await snapshot();
    expect((await cancel("Admin", "missing")).status).toBe(409);
    await db.update(Database.tables.users).set({ role: "None" });
    expect((await cancel()).status).toBe(409);
    expect(await snapshot()).toEqual(before);
  });

  it("許可されていない送信元から取り消せない", async () => {
    const before = await snapshot();
    expect((await request("/staff/orders/order-1/cancel", "Admin", "POST", "https://example.com")).status).toBe(403);
    expect(await snapshot()).toEqual(before);
  });

  it.each(["orders", "stocks"])("%sへの書き込み失敗では注文・全在庫・リビジョンを戻す", async (table) => {
    const before = await snapshot();
    await env.DB.prepare(
      `CREATE TRIGGER fail_cancellation BEFORE UPDATE ON ${table} ${table === "stocks" ? "WHEN OLD.menu_item_id = 'tea'" : ""} BEGIN SELECT RAISE(ABORT, 'forced cancellation failure'); END`,
    ).run();
    try {
      expect((await cancel()).status).toBe(500);
      expect(await snapshot()).toEqual(before);
    } finally {
      await env.DB.prepare("DROP TRIGGER fail_cancellation").run();
    }
  });
});
