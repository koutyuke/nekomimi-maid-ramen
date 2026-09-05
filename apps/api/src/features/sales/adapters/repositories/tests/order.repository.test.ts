import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer, Option } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderId } from "../../../../../core/domain/ids";
import { databaseLayer } from "../../../../../core/infra/drizzle/database";
import { menuItems, orderLines, orders, stocks } from "../../../../../core/infra/drizzle/schema";
import { OrderRepository } from "../../../application/ports/order.repository";
import { BusinessDate, ConfirmationRequestId, totalAmountOf } from "../../../domain/order";
import { orderLineFixture } from "../../../testing";
import { OrderRepositoryLive } from "../order.repository.live";
import type { OrderDraft } from "../../../domain/order";

const db = drizzle(env.DB);

const live = OrderRepositoryLive.pipe(Layer.provide(databaseLayer(env.DB)));

const businessDate = BusinessDate.make("2026-11-01");

const draftOf = (args: {
  id: string;
  requestId: string;
  lines: ReadonlyArray<ReturnType<typeof orderLineFixture>>;
}): OrderDraft => ({
  id: OrderId.make(args.id),
  businessDate,
  requestId: ConfirmationRequestId.make(args.requestId),
  lines: args.lines,
  totalAmount: totalAmountOf(args.lines),
  cookingState: "unstarted",
  confirmedAt: new Date("2026-11-01T02:00:00.000Z"),
});

const confirm = (draft: OrderDraft) =>
  Effect.runPromiseExit(
    Effect.gen(function* () {
      const repository = yield* OrderRepository;
      return yield* repository.confirm(draft);
    }).pipe(Effect.provide(live)),
  );

const findByRequestId = (requestId: string) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* OrderRepository;
      return yield* repository.findByRequestId(ConfirmationRequestId.make(requestId));
    }).pipe(Effect.provide(live)),
  );

const stockOf = async (menuItemId: string) => {
  const row = await db.select().from(stocks).where(eq(stocks.menuItemId, menuItemId)).get();

  return row?.quantity;
};

const countOrders = async () => (await db.select().from(orders).all()).length;
const countOrderLines = async () => (await db.select().from(orderLines).all()).length;

beforeEach(async () => {
  await db.delete(orderLines);
  await db.delete(orders);
  await db.delete(stocks);
  await db.delete(menuItems);
  await db.insert(menuItems).values([
    {
      id: "item-ramen",
      name: "ラーメン",
      description: null,
      price: 500,
      category: "main",
      displayOrder: 1,
      allergenCheckState: "unchecked",
      updatedAt: new Date(),
    },
    {
      id: "item-gyoza",
      name: "餃子",
      description: null,
      price: 400,
      category: "side",
      displayOrder: 2,
      allergenCheckState: "unchecked",
      updatedAt: new Date(),
    },
  ]);
  await db.insert(stocks).values([
    { menuItemId: "item-ramen", quantity: 3, updatedAt: new Date() },
    { menuItemId: "item-gyoza", quantity: 3, updatedAt: new Date() },
  ]);
});

describe("SPEC-SAL-005 確定した注文の保存", () => {
  it("注文と明細を保存し、営業日ごとに1から始まる注文番号を発行する", async () => {
    const first = await confirm(
      draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }),
    );
    const second = await confirm(
      draftOf({ id: "order-2", requestId: "request-2", lines: [orderLineFixture("item-gyoza", 2, 400)] }),
    );

    expect(first._tag === "Success" ? first.value.orderNumber : null).toBe(1);
    expect(second._tag === "Success" ? second.value.orderNumber : null).toBe(2);
    expect(second._tag === "Success" ? second.value.totalAmount : null).toBe(800);
    expect(await countOrderLines()).toBe(2);
  });

  it("確定時の価格を明細へ残す", async () => {
    await confirm(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 2, 480)] }));
    await db.update(menuItems).set({ price: 900 }).where(eq(menuItems.id, "item-ramen"));

    const stored = await findByRequestId("request-1");

    expect(Option.isSome(stored) ? stored.value.lines[0]?.unitPrice : null).toBe(480);
  });

  it("確定した注文を要求識別子から読み出せる", async () => {
    await confirm(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 1, 500), orderLineFixture("item-gyoza", 2, 400)],
      }),
    );

    const stored = await findByRequestId("request-1");

    expect(Option.isSome(stored)).toBe(true);
    expect(Option.isSome(stored) ? stored.value.lines.length : null).toBe(2);
    expect(Option.isSome(stored) ? stored.value.totalAmount : null).toBe(1300);
  });

  it("確定していない要求識別子では何も返さない", async () => {
    expect(Option.isNone(await findByRequestId("request-unknown"))).toBe(true);
  });

  it("同じ要求識別子の再送を重複として拒否する", async () => {
    await confirm(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }));
    const resent = await confirm(
      draftOf({ id: "order-2", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }),
    );

    expect(resent._tag === "Failure" && resent.cause._tag === "Fail" ? resent.cause.error._tag : null).toBe(
      "DuplicateConfirmation",
    );
    expect(await countOrders()).toBe(1);
    expect(await stockOf("item-ramen")).toBe(2);
  });
});

describe("SPEC-INV-003 注文保存と在庫減算の一体性", () => {
  it("確定した数量だけ在庫を減らす", async () => {
    await confirm(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 2, 500), orderLineFixture("item-gyoza", 1, 400)],
      }),
    );

    expect(await stockOf("item-ramen")).toBe(1);
    expect(await stockOf("item-gyoza")).toBe(2);
  });

  it("在庫を超える確定では注文も明細も在庫も変化しない", async () => {
    const exit = await confirm(
      draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 5, 500)] }),
    );

    expect(exit._tag === "Failure" && exit.cause._tag === "Fail" ? exit.cause.error._tag : null).toBe(
      "ConfirmationLostStockRace",
    );
    expect(await countOrders()).toBe(0);
    expect(await countOrderLines()).toBe(0);
    expect(await stockOf("item-ramen")).toBe(3);
  });

  it("複数商品のうち一つでも足りなければ他の商品の在庫も減らさない", async () => {
    await db.update(stocks).set({ quantity: 0 }).where(eq(stocks.menuItemId, "item-gyoza"));

    await confirm(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 1, 500), orderLineFixture("item-gyoza", 1, 400)],
      }),
    );

    expect(await countOrders()).toBe(0);
    expect(await stockOf("item-ramen")).toBe(3);
  });

  it("失敗した確定は注文番号の欠番を作らない", async () => {
    await confirm(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }));
    await confirm(draftOf({ id: "order-x", requestId: "request-x", lines: [orderLineFixture("item-ramen", 9, 500)] }));
    await confirm(draftOf({ id: "order-2", requestId: "request-2", lines: [orderLineFixture("item-ramen", 1, 500)] }));

    const stored = await db.select({ orderNumber: orders.orderNumber }).from(orders).orderBy(orders.orderNumber).all();

    expect(stored.map((row) => row.orderNumber)).toEqual([1, 2]);
  });

  it("在庫数を超える同時確定の合計が在庫数を超えない", async () => {
    const attempts = Array.from({ length: 6 }, (_, index) =>
      confirm(
        draftOf({
          id: `order-${index}`,
          requestId: `request-${index}`,
          lines: [orderLineFixture("item-ramen", 1, 500)],
        }),
      ),
    );

    const results = await Promise.all(attempts);

    expect(results.filter((exit) => exit._tag === "Success")).toHaveLength(3);
    expect(await countOrders()).toBe(3);
    expect(await stockOf("item-ramen")).toBe(0);
  });

  it("同じ営業日の注文番号を重複させない", async () => {
    const attempts = Array.from({ length: 3 }, (_, index) =>
      confirm(
        draftOf({
          id: `order-${index}`,
          requestId: `request-${index}`,
          lines: [orderLineFixture("item-ramen", 1, 500)],
        }),
      ),
    );

    await Promise.all(attempts);

    const stored = await db.select({ orderNumber: orders.orderNumber }).from(orders).all();

    expect(new Set(stored.map((row) => row.orderNumber)).size).toBe(3);
  });
});
