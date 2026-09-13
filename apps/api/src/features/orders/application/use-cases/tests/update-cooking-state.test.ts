import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

import { KitchenOrderConflict, OperationalOrder } from "../../../domain/order";
import { orderFixture, orderLineFixture, orderUpdatesGatewayMock } from "../../../testing";
import { OrderRepository } from "../../ports/outbound/order.repository";
import { UpdateCookingStateCommand } from "../../ports/outbound/update-cooking-state.command";
import { updateCookingState } from "../update-cooking-state";
import type { CookingState } from "../../../../../core/domain/cooking-state";

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
      cookingState: "cooking",
      name: "ラーメン",
      category: "main",
    },
  ],
} as const;
const orderWith = (cookingState: CookingState) =>
  new OperationalOrder({ ...orderData, lines: [{ ...orderData.lines[0], cookingState }] });

const repositoryWith = (order: OperationalOrder | null) =>
  Layer.succeed(OrderRepository, {
    findById: () => (order === null ? Effect.succeedNone : Effect.succeedSome(order)),
    findByRequestId: () => Effect.succeedNone,
    getRevision: () => Effect.succeed(0),
    findMany: () => Effect.succeed({ data: [], revision: 0 }),
  });

describe("SPEC-KIT-002 調理状況の遷移判定", () => {
  it("読み出した現在状態と変更先を確認してから更新する", async () => {
    const execute = vi.fn(() => Effect.void);
    const command = Layer.succeed(UpdateCookingStateCommand, { execute });

    await Effect.runPromise(
      updateCookingState({ id: "staff-1", role: "Staff" }, "order-1", "ramen", "completed").pipe(
        Effect.provide(Layer.mergeAll(repositoryWith(orderWith("cooking")), command, orderUpdatesGatewayMock)),
      ),
    );

    expect(execute).toHaveBeenCalledWith("staff-1", "order-1", "ramen", "cooking", "completed");
  });

  it.each([
    ["許可されない遷移", orderWith("unstarted")],
    ["不存在", null],
    ["取消済み", new OperationalOrder({ ...orderData, cancelledAt: new Date() })],
    ["受け渡し済み", new OperationalOrder({ ...orderData, handedOffAt: new Date() })],
    ["対象明細なし", new OperationalOrder({ ...orderData, lines: [] })],
  ] as const)("%sでは更新しない", async (_, order) => {
    const execute = vi.fn(() => Effect.void);
    const command = Layer.succeed(UpdateCookingStateCommand, { execute });

    const error = await Effect.runPromise(
      updateCookingState({ id: "staff-1", role: "Staff" }, "order-1", "ramen", "completed").pipe(
        Effect.flip,
        Effect.provide(Layer.mergeAll(repositoryWith(order), command, orderUpdatesGatewayMock)),
      ),
    );

    expect(error).toBeInstanceOf(KitchenOrderConflict);
    expect(execute).not.toHaveBeenCalled();
  });
});
