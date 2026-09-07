import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer, Option } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { makeDatabaseLive } from "../../../../../core/infra/drizzle/database";
import { menuItems, orderLines, orders, stocks } from "../../../../../core/infra/drizzle/schema";
import { OrderRepository } from "../../../application/ports/outbound/order.repository";
import { ConfirmationRequestId } from "../../../domain/order";
import { OrderRepositoryLive } from "../order.repository.live";

const db = drizzle(env.DB);
const live = OrderRepositoryLive.pipe(Layer.provide(makeDatabaseLive(env.DB)));

const findByRequestId = (requestId: string) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* OrderRepository;

      return yield* repository.findByRequestId(ConfirmationRequestId.make(requestId));
    }).pipe(Effect.provide(live)),
  );

const insertConfirmedOrder = async () => {
  const confirmedAt = new Date("2026-11-01T02:00:00.000Z");

  await db.insert(orders).values({
    id: "order-1",
    businessDate: "2026-11-01",
    orderNumber: 1,
    requestId: "request-1",
    totalAmount: 1300,
    cookingState: "unstarted",
    confirmedAt,
    updatedAt: confirmedAt,
  });
  await db.insert(orderLines).values([
    { orderId: "order-1", menuItemId: "item-ramen", quantity: 1, unitPrice: 500 },
    { orderId: "order-1", menuItemId: "item-gyoza", quantity: 2, unitPrice: 400 },
  ]);
};

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
});

describe("SPEC-SAL-005 注文リポジトリの読み出し", () => {
  it("確定した注文を要求識別子から復元する", async () => {
    await insertConfirmedOrder();

    const stored = await findByRequestId("request-1");

    expect(Option.isSome(stored)).toBe(true);
    expect(Option.isSome(stored) ? stored.value.lines.length : null).toBe(2);
    expect(Option.isSome(stored) ? stored.value.totalAmount : null).toBe(1300);
  });

  it("確定していない要求識別子では何も返さない", async () => {
    expect(Option.isNone(await findByRequestId("request-unknown"))).toBe(true);
  });
});
