import { Effect, Layer, Option } from "effect";
import { describe, expect, it, vi } from "vitest";

import { PersistenceError } from "../../../../../core/domain/persistence-error";
import { OperationalOrder, OrderCancellationConflict, OrderCancellationForbidden } from "../../../domain/order";
import { orderFixture, orderLineFixture } from "../../../testing";
import { CancelOrderCommand } from "../../ports/outbound/cancel-order.command";
import { OrderUpdatesGateway } from "../../ports/outbound/order-updates.gateway";
import { OrderRepository } from "../../ports/outbound/order.repository";
import { cancelOrder } from "../cancel-order";

const baseOrder = orderFixture({ id: "order-1", orderNumber: 1, requestId: "request-1", lines: [] });
const orderData = {
  id: baseOrder.id,
  businessDate: baseOrder.businessDate,
  orderNumber: baseOrder.orderNumber,
  confirmedAt: baseOrder.confirmedAt,
  cancelledAt: null,
  handedOffAt: null,
  lines: [
    {
      menuItemId: orderLineFixture("ramen", 1, 500).menuItemId,
      quantity: 1,
      name: "ラーメン",
      category: "main",
      cookingState: "cooking",
    },
  ],
} as const;
const order = new OperationalOrder(orderData);
const repositoryWith = (value: OperationalOrder | null = order) =>
  Layer.succeed(OrderRepository, {
    findById: () => Effect.succeed(Option.fromNullable(value)),
    findByRequestId: () => Effect.succeedNone,
    findLine: () => Effect.succeedNone,
    getRevision: () => Effect.succeed(0),
    findMany: () => Effect.succeed({ data: [], revision: 0 }),
  });

describe("SPEC-SAL-006 SPEC-SYS-009 注文取消の権限と通知", () => {
  it("保存完了後だけ注文と在庫の両方を通知する", async () => {
    let saved = false;
    const notify = vi.fn(() => {
      expect(saved).toBe(true);
      return Effect.void;
    });
    const at = new Date();
    const result = await Effect.runPromise(
      cancelOrder({ id: "admin", role: "Admin" }, "order-1").pipe(
        Effect.provide(
          Layer.mergeAll(
            repositoryWith(),
            Layer.succeed(CancelOrderCommand, {
              execute: () =>
                Effect.sync(() => {
                  saved = true;
                  return at;
                }),
            }),
            Layer.succeed(OrderUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(notify).toHaveBeenCalledExactlyOnceWith(["orders", "menu"]);
    expect(result).toEqual({ id: "order-1", cancelledBy: "admin", cancelledAt: at });
  });
  it.each([
    ["存在しない注文", null],
    ["取消済み", new OperationalOrder({ ...orderData, cancelledAt: new Date() })],
    ["受け渡し済み", new OperationalOrder({ ...orderData, handedOffAt: new Date() })],
    [
      "完成した商品あり",
      new OperationalOrder({ ...orderData, lines: [{ ...orderData.lines[0], cookingState: "completed" }] }),
    ],
    [
      "ドリンクだけ完成",
      new OperationalOrder({
        ...orderData,
        lines: [
          ...orderData.lines,
          {
            ...orderData.lines[0],
            menuItemId: orderLineFixture("tea", 1, 200).menuItemId,
            category: "drink",
            cookingState: "completed",
          },
        ],
      }),
    ],
  ] as const)("%sは保存処理を呼ぶ前に拒否する", async (_, value) => {
    const execute = vi.fn(() => Effect.succeed(new Date()));
    const notify = vi.fn(() => Effect.void);
    const result = await Effect.runPromise(
      cancelOrder({ id: "staff", role: "Staff" }, "order-1").pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            repositoryWith(value),
            Layer.succeed(CancelOrderCommand, { execute }),
            Layer.succeed(OrderUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(result).toBeInstanceOf(OrderCancellationConflict);
    expect(execute).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
  it("事前判定後に保存条件が変わった場合も成功にせず通知しない", async () => {
    const error = new OrderCancellationConflict();
    const execute = vi.fn(() => Effect.fail(error));
    const notify = vi.fn(() => Effect.void);
    const result = await Effect.runPromise(
      cancelOrder({ id: "staff", role: "Staff" }, "order-1").pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            repositoryWith(),
            Layer.succeed(CancelOrderCommand, { execute }),
            Layer.succeed(OrderUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(result).toBe(error);
    expect(execute).toHaveBeenCalledExactlyOnceWith("staff", "order-1");
    expect(notify).not.toHaveBeenCalled();
  });
  it("保存失敗では変更通知を送らない", async () => {
    const error = new PersistenceError({ operation: "注文の取消", cause: new Error("failure") });
    const notify = vi.fn(() => Effect.void);
    const result = await Effect.runPromise(
      cancelOrder({ id: "admin", role: "Admin" }, "order-1").pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            repositoryWith(),
            Layer.succeed(CancelOrderCommand, { execute: () => Effect.fail(error) }),
            Layer.succeed(OrderUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(result).toBe(error);
    expect(notify).not.toHaveBeenCalled();
  });
  it.each(["None"] as const)("HTTPを通さない%sの呼び出しでも保存と通知を拒否する", async (role) => {
    const execute = vi.fn(() => Effect.succeed(new Date()));
    const notify = vi.fn(() => Effect.void);
    const result = await Effect.runPromise(
      cancelOrder({ id: "staff", role }, "order-1").pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            repositoryWith(),
            Layer.succeed(CancelOrderCommand, { execute }),
            Layer.succeed(OrderUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(result).toBeInstanceOf(OrderCancellationForbidden);
    expect(execute).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
