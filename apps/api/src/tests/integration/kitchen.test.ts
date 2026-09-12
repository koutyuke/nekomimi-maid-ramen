/* eslint-disable no-await-in-loop -- 状態遷移と変更通知を順番に観測する。 */
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
const app = createApp({
  upgradeWebSocket: upgradeWebSocketMock,
  origin,
  aot: false,
  runtime: ManagedRuntime.make(
    Layer.mergeAll(
      realtimeMock,
      MenuLayer,
      makeOrdersLayer("").pipe(Layer.provide(Layer.mergeAll(MenuLayer, realtimeMock))),
      authenticationGatewayMock(staffFixture),
      staffRepositoryMock(),
    ).pipe(Layer.provide(makeDatabaseLive(env.DB))),
  ),
});
const request = (path: string, body?: unknown, method = body === undefined ? "GET" : "PATCH") =>
  app.handle(
    new Request(`https://api.nekomimi-ramen.com${path}`, {
      method,
      headers: { origin, "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
const update = (to: string, id = "order-1", menuItemId = "ramen") =>
  request(`/staff/orders/${id}/lines/${menuItemId}/cooking-state`, { to });
const handoff = (id = "order-1") => request(`/staff/orders/${id}/handoff`, {}, "POST");
const storedLine = async () =>
  (await db.select().from(Database.tables.orderLines).where(eq(Database.tables.orderLines.orderId, "order-1")))[0];
beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.delete(Database.tables.users);
  await db
    .insert(Database.tables.users)
    .values({ ...staffFixture, role: "Staff", emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  await db.insert(Database.tables.menuItems).values({
    id: "ramen",
    name: "ラーメン",
    price: 500,
    category: "main",
    displayOrder: 1,
    allergenCheckState: "unchecked",
    updatedAt: new Date(),
  });
  await db.insert(Database.tables.orders).values({
    id: "order-1",
    requestId: "request-1",
    businessDate: "2026-10-24",
    orderNumber: 1,
    totalAmount: 1000,
    confirmedAt: new Date("2026-10-24T01:00:00Z"),
    updatedAt: new Date(),
  });
  await db
    .insert(Database.tables.orderLines)
    .values({ orderId: "order-1", menuItemId: "ramen", quantity: 2, unitPrice: 500 });
});

describe("SPEC-KIT-001 確定注文の調理一覧", () => {
  it("注文候補と確定失敗は表示せず、確定成功後だけ一覧へ追加する", async () => {
    await db.delete(Database.tables.orderLines);
    await db.delete(Database.tables.orders);
    const candidate = { requestId: "confirmation-1", lines: [{ menuItemId: "ramen", quantity: 2 }] };
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({ orders: [] });
    const confirm = () =>
      app.handle(
        new Request("https://api.nekomimi-ramen.com/staff/orders", {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify(candidate),
        }),
      );
    expect((await confirm()).status).toBe(409);
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({ orders: [] });
    await db.insert(Database.tables.stocks).values({ menuItemId: "ramen", quantity: 2, updatedAt: new Date() });
    const response = await confirm();
    expect(response.status).toBe(201);
    const { businessDate } = Schema.decodeUnknownSync(Schema.Struct({ businessDate: Schema.String }))(
      await response.json(),
    );
    expect(await (await request(`/staff/orders?businessDate=${businessDate}`)).json()).toMatchObject({
      orders: [{ orderNumber: 1, cookingState: "unstarted" }],
    });
  });
  it("保存済みの確定注文を商品名と数量付きで返す", async () => {
    const response = await request("/staff/orders?businessDate=2026-10-24");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      orders: [
        {
          id: "order-1",
          orderNumber: 1,
          cookingState: "unstarted",
          lines: [{ name: "ラーメン", quantity: 2, category: "main" }],
        },
      ],
    });
  });
  it("営業日を指定しない一覧要求を拒否する", async () => {
    expect((await request("/staff/orders")).status).toBe(422);
  });
});

describe("SPEC-KIT-002 調理状況の保存条件", () => {
  it("注文全体を直接更新する経路は提供しない", async () => {
    expect((await request("/staff/orders/order-1/cooking-state", { to: "cooking" })).status).toBe(404);
  });
  it("着手を戻してから再着手・完成でき、別の取得にも完成が反映される", async () => {
    for (const to of ["cooking", "unstarted", "cooking", "completed"]) {
      expect((await update(to)).status).toBe(200);
      expect((await storedLine())?.cookingState).toBe(to);
    }
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({
      orders: [{ cookingState: "completed" }],
    });
  });
  it.each([
    ["unstarted", "completed"],
    ["completed", "cooking"],
    ["completed", "unstarted"],
    ["cooking", "cooking"],
  ] as const)("%sから%sを拒否する", async (current, to) => {
    await db.update(Database.tables.orderLines).set({ cookingState: current });
    expect((await update(to)).status).toBe(409);
    expect((await storedLine())?.cookingState).toBe(current);
  });
  it("同じ状態を見た二端末の操作は一方だけ成立する", async () => {
    const responses = await Promise.all([update("cooking"), update("cooking")]);
    expect(responses.map((response) => response.status).toSorted((left, right) => left - right)).toEqual([200, 409]);
  });
  it("存在しない注文の操作を成功扱いにしない", async () => {
    expect((await update("cooking", "missing")).status).toBe(409);
  });
  it("ルートの確認後に権限を失った担当者は保存できない", async () => {
    await db.update(Database.tables.users).set({ role: "None" });
    expect((await update("cooking")).status).toBe(409);
    expect((await storedLine())?.cookingState).toBe("unstarted");
  });
});

describe("SPEC-KIT-002 明細の独立性と注文全体の集計", () => {
  beforeEach(async () => {
    await db.insert(Database.tables.menuItems).values({
      id: "tea",
      name: "烏龍茶",
      price: 200,
      category: "drink",
      displayOrder: 2,
      allergenCheckState: "unchecked",
      updatedAt: new Date(),
    });
    await db
      .insert(Database.tables.orderLines)
      .values({ orderId: "order-1", menuItemId: "tea", quantity: 1, unitPrice: 200 });
  });
  const current = async () =>
    Schema.decodeUnknownSync(
      Schema.Struct({
        orders: Schema.Array(
          Schema.Struct({
            cookingState: Schema.String,
            lines: Schema.Array(
              Schema.Struct({ menuItemId: Schema.String, quantity: Schema.Int, cookingState: Schema.String }),
            ),
          }),
        ),
      }),
    )(await (await request("/staff/orders?businessDate=2026-10-24")).json()).orders[0]!;

  it("同じ注文の別明細への同時着手は両方成立し、数量と在庫を変更しない", async () => {
    await db.insert(Database.tables.stocks).values({ menuItemId: "ramen", quantity: 8, updatedAt: new Date() });
    const responses = await Promise.all([update("cooking"), update("cooking", "order-1", "tea")]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect((await current()).lines).toEqual([
      { menuItemId: "ramen", quantity: 2, cookingState: "cooking" },
      { menuItemId: "tea", quantity: 1, cookingState: "cooking" },
    ]);
    expect((await db.select().from(Database.tables.stocks))[0]?.quantity).toBe(8);
  });
  it("全未調理・一部着手・着手取消・一部完成・全完成を明細から算出する", async () => {
    expect((await current()).cookingState).toBe("unstarted");
    expect((await update("cooking")).status).toBe(200);
    expect((await current()).cookingState).toBe("cooking");
    expect((await update("unstarted")).status).toBe(200);
    expect((await current()).cookingState).toBe("unstarted");
    await update("cooking");
    await update("completed");
    expect((await current()).cookingState).toBe("cooking");
    expect((await update("completed", "order-1", "tea")).status).toBe(409);
    await update("cooking", "order-1", "tea");
    await update("completed", "order-1", "tea");
    expect((await current()).cookingState).toBe("completed");
  });
  it("存在しない明細の指定で他の商品を更新しない", async () => {
    expect((await update("cooking", "order-1", "missing")).status).toBe(409);
    expect((await current()).cookingState).toBe("unstarted");
  });
  it("一部完成では受け渡しを成立させない", async () => {
    await update("cooking");
    await update("completed");
    expect((await handoff()).status).toBe(409);
  });
});

describe("SPEC-HAND-001 SPEC-HAND-002 受け渡しの成立条件と一度だけの保存", () => {
  it("全明細の完成後に一度だけ日時を記録し、同時操作と再送でも上書きしない", async () => {
    expect((await handoff()).status).toBe(409);
    await update("cooking");
    expect((await handoff()).status).toBe(409);
    await update("completed");
    const responses = await Promise.all([handoff(), handoff()]);
    expect(responses.map((response) => response.status).toSorted((left, right) => left - right)).toEqual([200, 409]);
    const success = responses.find((response) => response.status === 200)!;
    const { handedOffAt } = Schema.decodeUnknownSync(Schema.Struct({ handedOffAt: Schema.String }))(
      await success.json(),
    );
    expect(Number.isNaN(Date.parse(handedOffAt))).toBe(false);
    expect((await handoff()).status).toBe(409);
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({
      orders: [{ id: "order-1", cookingState: "completed", handedOffAt, cancelledAt: null }],
    });
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({
      orders: [{ handedOffAt }],
    });
  });
  it("取消・存在しない注文・明細のない注文では受け渡さない", async () => {
    await update("cooking");
    await update("completed");
    await db.update(Database.tables.orders).set({ cancelledAt: new Date() });
    expect((await handoff()).status).toBe(409);
    expect((await handoff("missing")).status).toBe(409);
    await db.update(Database.tables.orders).set({ cancelledAt: null });
    await db.delete(Database.tables.orderLines);
    expect((await handoff()).status).toBe(409);
  });
  it("保存の直前に権限を失った担当者は受け渡しできない", async () => {
    await update("cooking");
    await update("completed");
    await db.update(Database.tables.users).set({ role: "None" });
    expect((await handoff()).status).toBe(409);
  });
  it("営業日で未取消注文を絞り込む", async () => {
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({
      orders: [{ id: "order-1", cookingState: "unstarted", handedOffAt: null, cancelledAt: null }],
    });
    expect(await (await request("/staff/orders?businessDate=2026-10-25")).json()).toMatchObject({ orders: [] });
    await db.update(Database.tables.orders).set({ cancelledAt: new Date() });
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({ orders: [] });
  });
});

describe("SPEC-KIT-001 調理対象の絞り込みと順序", () => {
  it("取り消した注文は表示も更新もできない", async () => {
    await db.update(Database.tables.orders).set({ cancelledAt: new Date() });
    expect(await (await request("/staff/orders?businessDate=2026-10-24")).json()).toMatchObject({ orders: [] });
    expect((await update("cooking")).status).toBe(409);
    expect((await storedLine())?.cookingState).toBe("unstarted");
  });
});
