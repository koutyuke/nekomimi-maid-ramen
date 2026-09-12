import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer, ManagedRuntime, Schema } from "effect";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../bootstrap/create-app";
import { PersistenceError } from "../../core/domain/persistence-error";
import { Revision } from "../../core/domain/revision";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { connectWebSocketHub } from "../../core/infra/websocket";
import { MenuLayer } from "../../features/menu/layer";
import { makeOrdersLayer } from "../../features/orders/layer";
import { confirmOrder } from "../../features/orders/public";
import { makeRealtimeLayer } from "../../features/realtime/layer";
import { failingUpdateNotifierMock } from "../../features/realtime/testing";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../features/staff/testing";
import { ConfirmedOrderResponse } from "../../routes/orders/orders.response";

const db = drizzle(env.DB);
const origin = "https://staff.nekomimi-ramen.com";
const realtimeLive = makeRealtimeLayer(env.STAFF_UPDATES);
const runtime = (realtime = realtimeLive, staff = staffFixture) =>
  ManagedRuntime.make(
    Layer.mergeAll(
      MenuLayer,
      makeOrdersLayer("").pipe(Layer.provide(Layer.mergeAll(MenuLayer, realtime))),
      realtime,
      authenticationGatewayMock(staff),
      staffRepositoryMock(),
    ).pipe(Layer.provide(makeDatabaseLive(env.DB))),
  );
const live = runtime();
const upgradeWebSocket = (sessionId: string) => connectWebSocketHub(env.STAFF_UPDATES, sessionId);
const app = createApp({ origin, runtime: live, upgradeWebSocket, aot: false });
const request = (path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (!headers.has("origin")) {
    headers.set("origin", origin);
  }
  headers.set("content-type", "application/json");
  const input = new Request(`https://api.nekomimi-ramen.com${path}`, {
    ...init,
    headers,
  });
  return app.handle(input);
};
const revisions = async () => {
  const response = Schema.Struct({ revision: Revision });
  const [menu, orders] = await Promise.all(
    ["menu", "orders"].map(
      async (scope) =>
        Schema.decodeUnknownSync(response)(await (await request(`/staff/${scope}/revision`)).json()).revision,
    ),
  );
  return { menu: menu!, orders: orders! };
};
const sockets: WebSocket[] = [];
const connect = async () => {
  const response = await request("/staff/events", { headers: { upgrade: "websocket" } });
  expect(response.status).toBe(101);
  const socket = response.webSocket!;
  expect(socket).toBeDefined();
  socket.accept();
  sockets.push(socket);
  return socket;
};
const nextMessage = (socket: WebSocket) =>
  new Promise<string>((resolve) => {
    socket.addEventListener("message", (event) => resolve(String(event.data)), { once: true });
  });
const nextClose = (socket: WebSocket) =>
  new Promise<number>((resolve) => {
    socket.addEventListener("close", (event) => resolve(event.code), { once: true });
  });
const confirmBody = { requestId: "confirm", lines: [{ menuItemId: "ramen", quantity: 1 }] };

beforeEach(async () => {
  await db.delete(Database.tables.sessions);
  await db.delete(Database.tables.users);
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db
    .insert(Database.tables.users)
    .values({ ...staffFixture, role: "Staff", emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  await db.insert(Database.tables.sessions).values({
    id: "test-session",
    userId: staffFixture.id,
    token: "test-token",
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
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
});
afterEach(() => {
  for (const socket of sockets.splice(0)) {
    socket.close();
  }
});
afterAll(() => live.dispose());

describe("SPEC-SYS-009 スタッフの通知とリビジョン照合", () => {
  it("領域ごとのリビジョンを返し、WebSocket接続なしで変更を検出できる", async () => {
    const menu = await request("/staff/menu/revision");
    const orders = await request("/staff/orders/revision");
    expect(menu.status).toBe(200);
    expect(orders.status).toBe(200);
    expect(menu.headers.get("cache-control")).toBe("no-store");
    expect(await menu.json()).toEqual({ revision: (await revisions()).menu });
    expect(await orders.json()).toEqual({ revision: (await revisions()).orders });
  });

  it("ユースケースをHTTP以外から実行しても保存後の通知を送る", async () => {
    const socket = await connect();
    const message = nextMessage(socket);
    await live.runPromise(confirmOrder(confirmBody));
    expect(JSON.parse(await message)).toMatchObject({ type: "changed" });
  });

  it("在庫残数と一致するリビジョンを返し、公開メニューには残数を返さない", async () => {
    const response = await request("/staff/menu");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      revision: (await revisions()).menu,
      items: [{ id: "ramen", quantity: 10, sellable: true }],
    });
    const publicMenu = await (await request("/menu")).json();
    expect(JSON.stringify(publicMenu)).not.toContain("quantity");
    expect(JSON.stringify(publicMenu)).not.toContain("revision");
  });

  it("保存成功後に7接続へ通知し、同じ要求の再送でも注文と在庫を重複更新しない", async () => {
    const clients = await Promise.all(Array.from({ length: 7 }, () => connect()));
    const changes = clients.map(nextMessage);
    const response = await request("/staff/orders", { method: "POST", body: JSON.stringify(confirmBody) });
    expect(response.status).toBe(201);
    const current = await revisions();
    const expected = JSON.stringify({ type: "changed", revisions: current });
    expect(await Promise.all(changes)).toEqual(Array.from({ length: 7 }, () => expected));
    expect((await db.select().from(Database.tables.stocks))[0]?.quantity).toBe(9);
    const retry = await request("/staff/orders", { method: "POST", body: JSON.stringify(confirmBody) });
    expect(await retry.json()).toEqual(await response.json());
    expect(await revisions()).toEqual(current);
    expect(await db.select().from(Database.tables.orders)).toHaveLength(1);
  });

  it.each(["failure", "timeout"])("通知先が%sでも保存は成功し、接続中の端末が照合で変化を検出できる", async (mode) => {
    await connect();
    const before = await revisions();
    const failing = failingUpdateNotifierMock(
      mode === "timeout"
        ? Effect.never
        : Effect.fail(new PersistenceError({ operation: "通知", cause: new Error("injected notification failure") })),
    );
    const failedNotificationRuntime = runtime(failing);
    try {
      const failingApp = createApp({ origin, runtime: failedNotificationRuntime, upgradeWebSocket, aot: false });
      const response = await failingApp.handle(
        new Request("https://api.nekomimi-ramen.com/staff/orders", {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify(confirmBody),
        }),
      );
      expect(response.status).toBe(201);
      const current = await revisions();
      expect(current.menu).toBeGreaterThan(before.menu);
      expect(current.orders).toBeGreaterThan(before.orders);
      expect(await (await request("/staff/menu")).json()).toMatchObject({
        revision: current.menu,
        items: [{ quantity: 9 }],
      });
    } finally {
      await failedNotificationRuntime.dispose();
    }
  });

  it("保存できない状態変更は通知せず、調理と受け渡しの成功後に注文だけを通知する", async () => {
    const response = await request("/staff/orders", { method: "POST", body: JSON.stringify(confirmBody) });
    const { orderId: id } = Schema.decodeUnknownSync(ConfirmedOrderResponse)(await response.json());
    const socket = await connect();
    const messages: string[] = [];
    socket.addEventListener("message", (event) => {
      messages.push(String(event.data));
    });
    const before = await revisions();
    const rejected = await request(`/staff/orders/${id}/handoff`, { method: "POST" });
    expect(rejected.status).toBe(409);
    expect(await revisions()).toEqual(before);
    /* eslint-disable no-await-in-loop -- 注文の状態遷移と通知を順番に確かめる。 */
    for (const to of ["cooking", "completed"]) {
      const changed = nextMessage(socket);
      expect(
        (
          await request(`/staff/orders/${id}/lines/ramen/cooking-state`, {
            method: "PATCH",
            body: JSON.stringify({ to }),
          })
        ).status,
      ).toBe(200);
      const current = await revisions();
      expect(current.menu).toBe(before.menu);
      expect(JSON.parse(await changed)).toEqual({ type: "changed", revisions: { orders: current.orders } });
    }
    /* eslint-enable no-await-in-loop */
    const changed = nextMessage(socket);
    expect((await request(`/staff/orders/${id}/handoff`, { method: "POST" })).status).toBe(200);
    const current = await revisions();
    expect(JSON.parse(await changed)).toEqual({ type: "changed", revisions: { orders: current.orders } });
    expect(messages).toHaveLength(3);
  });

  it.each(["role", "logout", "expiry"])("%sによる失効後は変更通知を一件も送らず接続を閉じる", async (change) => {
    const socket = await connect();
    const messages: unknown[] = [];
    socket.addEventListener("message", (event) => {
      messages.push(event.data);
    });
    const closed = nextClose(socket);
    if (change === "role") {
      await db.update(Database.tables.users).set({ role: "None" });
    } else if (change === "logout") {
      await db.delete(Database.tables.sessions);
    } else {
      await db.update(Database.tables.sessions).set({ expiresAt: new Date(0) });
    }
    await env.STAFF_UPDATES.getByName("nekomimi-maid-ramen").publish({ orders: 123 });
    expect(await closed).toBe(1008);
    expect(messages).toEqual([]);
  });

  it("公開Origin・偽装Origin・Originなしの接続を拒否する", async () => {
    await Promise.all(
      ["https://nekomimi-ramen.com", "https://staff.nekomimi-ramen.com.evil.test", "null", ""].map(
        async (requestOrigin) => {
          const response = await request("/staff/events", {
            headers: { origin: requestOrigin, upgrade: "websocket" },
          });
          expect(response.status).toBe(403);
        },
      ),
    );
  });

  it("通常のGETは切り替えを要求し、接続先の障害は内部情報を含まない503を返す", async () => {
    expect((await request("/staff/events")).status).toBe(426);
    const unavailable = createApp({
      origin,
      runtime: live,
      aot: false,
      upgradeWebSocket: () => Promise.reject(new Error("PRIVATE_CONNECTION_FAILURE")),
    });
    const response = await unavailable.handle(
      new Request("https://api.nekomimi-ramen.com/staff/events", {
        headers: { origin, upgrade: "websocket" },
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "sync_unavailable" });
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
  });
});
