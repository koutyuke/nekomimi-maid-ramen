import { Effect, Layer, Option } from "effect";
import { describe, expect, it, vi } from "vitest";

import { PersistenceError } from "../../../../../core/domain/persistence-error";
import { HandoffConflict, OperationalOrder } from "../../../domain/order";
import { orderFixture, orderLineFixture } from "../../../testing";
import { CompleteHandoffCommand } from "../../ports/outbound/complete-handoff.command";
import { OrderUpdatesGateway } from "../../ports/outbound/order-updates.gateway";
import { OrderRepository } from "../../ports/outbound/order.repository";
import { completeHandoff } from "../complete-handoff";

const confirmed = orderFixture({ id: "order-1", orderNumber: 1, requestId: "request-1", lines: [] });
const orderData = {
  id: confirmed.id,
  businessDate: confirmed.businessDate,
  orderNumber: confirmed.orderNumber,
  confirmedAt: confirmed.confirmedAt,
  cancelledAt: null,
  handedOffAt: null,
  lines: [
    {
      menuItemId: orderLineFixture("ramen", 1, 500).menuItemId,
      quantity: 1,
      cookingState: "completed",
      name: "ラーメン",
      category: "main",
    },
  ],
} as const;
const order = new OperationalOrder(orderData);

const run = (
  value: OperationalOrder | null,
  execute: typeof CompleteHandoffCommand.Service.execute,
  notify: typeof OrderUpdatesGateway.Service.notify,
  role: "Staff" | "None" = "Staff",
) =>
  Effect.runPromise(
    completeHandoff({ id: "staff", role }, "order-1").pipe(
      Effect.either,
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(OrderRepository, {
            findById: () => Effect.succeed(Option.fromNullable(value)),
            findByRequestId: () => Effect.succeedNone,
            getRevision: () => Effect.succeed(0),
            findMany: () => Effect.succeed({ data: [], revision: 0 }),
          }),
          Layer.succeed(CompleteHandoffCommand, { execute }),
          Layer.succeed(OrderUpdatesGateway, { notify }),
        ),
      ),
    ),
  );

describe("SPEC-HAND-002 受け渡しの成立条件と通知", () => {
  it.each([
    ["不存在", null],
    ["取消済み", new OperationalOrder({ ...orderData, cancelledAt: new Date() })],
    ["受け渡し済み", new OperationalOrder({ ...orderData, handedOffAt: new Date() })],
    ["明細なし", new OperationalOrder({ ...orderData, lines: [] })],
    [
      "一部未完成",
      new OperationalOrder({
        ...orderData,
        lines: [
          ...orderData.lines,
          {
            ...orderData.lines[0],
            menuItemId: orderLineFixture("tea", 1, 200).menuItemId,
            category: "drink",
            cookingState: "cooking",
          },
        ],
      }),
    ],
  ] as const)("%sは保存・通知の前に拒否する", async (_, value) => {
    const execute = vi.fn(() => Effect.succeed(new Date()));
    const notify = vi.fn(() => Effect.void);
    const result = await run(value, execute, notify);
    expect(result._tag === "Left" ? result.left : null).toBeInstanceOf(HandoffConflict);
    expect(execute).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("全明細完成の場合だけ保存し、保存後に注文を通知する", async () => {
    const at = new Date();
    let saved = false;
    const execute = vi.fn(() =>
      Effect.sync(() => {
        saved = true;
        return at;
      }),
    );
    const notify = vi.fn(() => Effect.sync(() => expect(saved).toBe(true)));
    const result = await run(order, execute, notify);
    expect(result._tag === "Right" ? result.right : null).toEqual({ id: "order-1", handedOffAt: at });
    expect(execute).toHaveBeenCalledExactlyOnceWith("staff", order.id);
    expect(notify).toHaveBeenCalledExactlyOnceWith(["orders"]);
  });

  it.each([new HandoffConflict(), new PersistenceError({ operation: "受け渡しの完了", cause: new Error("failure") })])(
    "保存時の競合・失敗では成功にせず通知しない",
    async (failure) => {
      const notify = vi.fn(() => Effect.void);
      const result = await run(order, () => Effect.fail(failure), notify);
      expect(result._tag === "Left" ? result.left : null).toBe(failure);
      expect(notify).not.toHaveBeenCalled();
    },
  );

  it("Noneは保存・通知できない", async () => {
    const execute = vi.fn(() => Effect.succeed(new Date()));
    const notify = vi.fn(() => Effect.void);
    const result = await run(order, execute, notify, "None");
    expect(result._tag === "Left" ? result.left._tag : null).toBe("HandoffForbidden");
    expect(execute).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
