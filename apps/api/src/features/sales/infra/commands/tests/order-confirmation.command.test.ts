import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderId } from "../../../../../core/domain/ids";
import { Amount } from "../../../../../core/domain/money";
import { Database, makeDatabaseLive } from "../../../../../core/infra/drizzle";
import { OrderConfirmationCommand } from "../../../application/ports/outbound/order-confirmation.command";
import { BusinessDate, ConfirmationRequestId } from "../../../domain/order";
import { orderLineFixture } from "../../../testing";
import { OrderConfirmationCommandLive } from "../order-confirmation.command.live";
import type { OrderDraft } from "../../../domain/order";

const db = drizzle(env.DB);
const live = OrderConfirmationCommandLive.pipe(Layer.provide(makeDatabaseLive(env.DB)));
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
  totalAmount: Amount.make(args.lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0)),
  cookingState: "unstarted",
  confirmedAt: new Date("2026-11-01T02:00:00.000Z"),
});

const execute = (draft: OrderDraft) =>
  Effect.runPromiseExit(
    Effect.gen(function* () {
      const confirmation = yield* OrderConfirmationCommand;

      return yield* confirmation.execute(draft);
    }).pipe(Effect.provide(live)),
  );

const stockOf = async (menuItemId: string) =>
  (await db.select().from(Database.tables.stocks).where(eq(Database.tables.stocks.menuItemId, menuItemId)).get())
    ?.quantity;
const countOrders = async () => (await db.select().from(Database.tables.orders).all()).length;
const countOrderLines = async () => (await db.select().from(Database.tables.orderLines).all()).length;

beforeEach(async () => {
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.insert(Database.tables.menuItems).values([
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
  await db.insert(Database.tables.stocks).values([
    { menuItemId: "item-ramen", quantity: 3, updatedAt: new Date() },
    { menuItemId: "item-gyoza", quantity: 3, updatedAt: new Date() },
  ]);
});

describe("SPEC-INV-003 注文確定の原子性", () => {
  it("注文と明細を保存し、営業日ごとに1から始まる注文番号を発行する", async () => {
    const first = await execute(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 1, 500)],
      }),
    );
    const second = await execute(
      draftOf({
        id: "order-2",
        requestId: "request-2",
        lines: [orderLineFixture("item-gyoza", 2, 400)],
      }),
    );

    expect(first._tag === "Success" ? first.value.orderNumber : null).toBe(1);
    expect(second._tag === "Success" ? second.value.orderNumber : null).toBe(2);
    expect(second._tag === "Success" ? second.value.totalAmount : null).toBe(800);
    expect(await countOrderLines()).toBe(2);
  });

  it("確定時の価格を明細へ残す", async () => {
    await execute(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 2, 480)] }));
    await db
      .update(Database.tables.menuItems)
      .set({ price: 900 })
      .where(eq(Database.tables.menuItems.id, "item-ramen"));

    const stored = await db
      .select()
      .from(Database.tables.orderLines)
      .where(eq(Database.tables.orderLines.orderId, "order-1"))
      .all();

    expect(stored[0]?.unitPrice).toBe(480);
  });

  it("在庫制約に失敗すると注文と明細も保存しない", async () => {
    const exit = await execute(
      draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 5, 500)] }),
    );

    expect(exit._tag === "Failure" && exit.cause._tag === "Fail" ? exit.cause.error._tag : null).toBe(
      "ConfirmationLostStockRace",
    );
    expect(await countOrders()).toBe(0);
    expect(await countOrderLines()).toBe(0);
    expect(await stockOf("item-ramen")).toBe(3);
  });

  it("複数商品のうち一つでも不足すれば全体を取り消す", async () => {
    await db
      .update(Database.tables.stocks)
      .set({ quantity: 0 })
      .where(eq(Database.tables.stocks.menuItemId, "item-gyoza"));

    await execute(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 1, 500), orderLineFixture("item-gyoza", 1, 400)],
      }),
    );

    expect(await countOrders()).toBe(0);
    expect(await countOrderLines()).toBe(0);
    expect(await stockOf("item-ramen")).toBe(3);
  });

  it("確定した数量だけ在庫を減らす", async () => {
    await execute(
      draftOf({
        id: "order-1",
        requestId: "request-1",
        lines: [orderLineFixture("item-ramen", 2, 500), orderLineFixture("item-gyoza", 1, 400)],
      }),
    );

    expect(await stockOf("item-ramen")).toBe(1);
    expect(await stockOf("item-gyoza")).toBe(2);
  });

  it("失敗した確定は注文番号の欠番を作らない", async () => {
    await execute(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }));
    await execute(draftOf({ id: "order-x", requestId: "request-x", lines: [orderLineFixture("item-ramen", 9, 500)] }));
    await execute(draftOf({ id: "order-2", requestId: "request-2", lines: [orderLineFixture("item-ramen", 1, 500)] }));

    const stored = await db
      .select({ orderNumber: Database.tables.orders.orderNumber })
      .from(Database.tables.orders)
      .orderBy(Database.tables.orders.orderNumber)
      .all();

    expect(stored.map((row) => row.orderNumber)).toEqual([1, 2]);
  });
});

describe("SPEC-SAL-005 注文確定の冪等性と競合", () => {
  it("同じ要求識別子を二度確定しても注文と在庫を二重に変更しない", async () => {
    await execute(draftOf({ id: "order-1", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }));
    const resent = await execute(
      draftOf({ id: "order-2", requestId: "request-1", lines: [orderLineFixture("item-ramen", 1, 500)] }),
    );

    expect(resent._tag === "Failure" && resent.cause._tag === "Fail" ? resent.cause.error._tag : null).toBe(
      "DuplicateConfirmation",
    );
    expect(await countOrders()).toBe(1);
    expect(await stockOf("item-ramen")).toBe(2);
  });

  it("同時確定の合計が在庫数を超えない", async () => {
    const attempts = Array.from({ length: 6 }, (_, index) =>
      execute(
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
      execute(
        draftOf({
          id: `order-${index}`,
          requestId: `request-${index}`,
          lines: [orderLineFixture("item-ramen", 1, 500)],
        }),
      ),
    );

    await Promise.all(attempts);

    const stored = await db
      .select({ orderNumber: Database.tables.orders.orderNumber })
      .from(Database.tables.orders)
      .all();

    expect(new Set(stored.map((row) => row.orderNumber)).size).toBe(3);
  });
});
