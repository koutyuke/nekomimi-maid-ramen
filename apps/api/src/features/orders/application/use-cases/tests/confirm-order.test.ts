import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { MenuItemId } from "../../../../../core/domain/ids";
import { menuItemFixture, stockFixture } from "../../../../menu/testing";
import {
  ConfirmationLostStockRace,
  ConfirmationRequestId,
  DuplicateConfirmation,
  LineQuantity,
} from "../../../domain/order";
import {
  orderFixture,
  orderLineFixture,
  orderPricingGatewayMock,
  orderRepositoryMock,
  orderStockAvailabilityGatewayMock,
  orderStockAvailabilityGatewaySequenceMock,
} from "../../../testing";
import { confirmOrder } from "../confirm-order";
import type { OrderRepositoryMockOptions } from "../../../testing";
import type { ConfirmOrderInput } from "../confirm-order";

const ramen = menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 });
const gyoza = menuItemFixture({ id: "item-gyoza", name: "餃子", price: 400, displayOrder: 2, category: "side" });

const requestId = ConfirmationRequestId.make("request-1");

const line = (menuItemId: string, quantity: number) => ({
  menuItemId: MenuItemId.make(menuItemId),
  quantity: LineQuantity.make(quantity),
});

const environment = (options: {
  readonly stocks: ReadonlyArray<ReturnType<typeof stockFixture>>;
  readonly stockSnapshots?: ReadonlyArray<ReadonlyArray<ReturnType<typeof stockFixture>>>;
  readonly orders?: OrderRepositoryMockOptions;
}) =>
  Layer.mergeAll(
    orderPricingGatewayMock([ramen, gyoza]),
    options.stockSnapshots === undefined
      ? orderStockAvailabilityGatewayMock(options.stocks)
      : orderStockAvailabilityGatewaySequenceMock(options.stockSnapshots),
    orderRepositoryMock(options.orders),
  );

const confirm = (layers: ReturnType<typeof environment>, input: ConfirmOrderInput) =>
  Effect.runPromise(confirmOrder(input).pipe(Effect.provide(layers)));

const confirmFailure = (layers: ReturnType<typeof environment>, input: ConfirmOrderInput) =>
  Effect.runPromise(Effect.flip(confirmOrder(input).pipe(Effect.provide(layers))));

describe("SPEC-SAL-005 注文の確定", () => {
  it("販売可能な注文候補から注文を1件作り、注文番号を発行する", async () => {
    const order = await confirm(
      environment({ stocks: [stockFixture("item-ramen", 3), stockFixture("item-gyoza", 3)] }),
      { requestId, lines: [line("item-ramen", 2), line("item-gyoza", 1)] },
    );

    expect(order.orderNumber).toBe(1);
    expect(order.totalAmount).toBe(1400);
    expect(order.cookingState).toBe("unstarted");
    expect(order.lines.map((orderLine) => orderLine.unitPrice)).toEqual([500, 400]);
  });

  it("確定済みの要求を再送しても保存先へ確定を送らない", async () => {
    const existing = orderFixture({
      id: "order-1",
      orderNumber: 7,
      requestId: "request-1",
      lines: [orderLineFixture("item-ramen", 1, 500)],
    });
    let confirmCalls = 0;

    const order = await confirm(
      environment({
        stocks: [stockFixture("item-ramen", 3)],
        orders: {
          confirmed: [existing],
          confirm: () => {
            confirmCalls += 1;

            return Effect.succeed(existing);
          },
        },
      }),
      { requestId, lines: [line("item-ramen", 1)] },
    );

    expect(order.orderNumber).toBe(7);
    expect(confirmCalls).toBe(0);
  });
});

describe("SPEC-INV-002 確定直前の在庫再確認", () => {
  it("在庫が不足する商品を要求数と残数付きで拒否する", async () => {
    const error = await confirmFailure(environment({ stocks: [stockFixture("item-ramen", 1)] }), {
      requestId,
      lines: [line("item-ramen", 2)],
    });

    expect(error._tag).toBe("OutOfStock");
    expect(error._tag === "OutOfStock" ? error.shortages : null).toEqual([
      { menuItemId: "item-ramen", requested: 2, available: 1 },
    ]);
  });

  it("在庫の記録がない商品を確定できない", async () => {
    const error = await confirmFailure(environment({ stocks: [] }), { requestId, lines: [line("item-ramen", 1)] });

    expect(error._tag).toBe("OutOfStock");
  });

  it("販売していない商品を確定できない", async () => {
    const error = await confirmFailure(environment({ stocks: [stockFixture("item-ramen", 3)] }), {
      requestId,
      lines: [line("item-unknown", 1)],
    });

    expect(error._tag).toBe("UnknownMenuItem");
  });

  it("不足する商品があるとき在庫を減らさない", async () => {
    let confirmCalls = 0;

    await confirmFailure(
      environment({
        stocks: [stockFixture("item-ramen", 0)],
        orders: {
          confirm: (draft) => {
            confirmCalls += 1;

            return Effect.succeed(orderFixture({ ...draft, orderNumber: 1 }));
          },
        },
      }),
      { requestId, lines: [line("item-ramen", 1)] },
    );

    expect(confirmCalls).toBe(0);
  });
});

describe("SPEC-INV-003 確定が保存先で競合した場合", () => {
  it("在庫の競合に敗れたら現在の在庫で不足を作り直して拒否する", async () => {
    const error = await confirmFailure(
      environment({
        stocks: [stockFixture("item-ramen", 3)],
        stockSnapshots: [[stockFixture("item-ramen", 3)], [stockFixture("item-ramen", 0)]],
        orders: { confirm: () => Effect.fail(new ConfirmationLostStockRace({ requestId })) },
      }),
      { requestId, lines: [line("item-ramen", 1)] },
    );

    expect(error._tag).toBe("OutOfStock");
    expect(error._tag === "OutOfStock" ? error.shortages : null).toEqual([
      { menuItemId: "item-ramen", requested: 1, available: 0 },
    ]);
  });

  it("保存先が重複と判定したら既存の注文を返す", async () => {
    const existing = orderFixture({
      id: "order-1",
      orderNumber: 5,
      requestId: "request-1",
      lines: [orderLineFixture("item-ramen", 1, 500)],
    });
    const confirmed: Array<typeof existing> = [];

    const order = await confirm(
      environment({
        stocks: [stockFixture("item-ramen", 3)],
        orders: {
          confirmed,
          confirm: (draft) => {
            confirmed.push(existing);

            return Effect.fail(new DuplicateConfirmation({ requestId: draft.requestId }));
          },
        },
      }),
      { requestId, lines: [line("item-ramen", 1)] },
    );

    expect(order.orderNumber).toBe(5);
  });

  it("重複と判定された注文を読み出せないときは保存先の失敗として扱う", async () => {
    const error = await confirmFailure(
      environment({
        stocks: [stockFixture("item-ramen", 3)],
        orders: { confirm: (draft) => Effect.fail(new DuplicateConfirmation({ requestId: draft.requestId })) },
      }),
      { requestId, lines: [line("item-ramen", 1)] },
    );

    expect(error._tag).toBe("PersistenceError");
  });
});
