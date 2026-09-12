import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

import { KitchenOrderConflict } from "../../../domain/order";
import { orderLineFixture } from "../../../testing";
import { OrderRepository } from "../../ports/outbound/order.repository";
import { UpdateCookingStateCommand } from "../../ports/outbound/update-cooking-state.command";
import { updateCookingState } from "../update-cooking-state";
import type { CookingState } from "../../../../../core/domain/cooking-state";

const repositoryWith = (cookingState: CookingState) =>
  Layer.succeed(OrderRepository, {
    findByRequestId: () => Effect.succeedNone,
    findLine: () => Effect.succeedSome(orderLineFixture("ramen", 1, 500, cookingState)),
    list: () => Effect.succeed([]),
  });

describe("SPEC-KIT-002 調理状況の遷移判定", () => {
  it("読み出した現在状態と変更先を確認してから更新する", async () => {
    const execute = vi.fn(() => Effect.void);
    const command = Layer.succeed(UpdateCookingStateCommand, { execute });

    await Effect.runPromise(
      updateCookingState({ id: "staff-1", role: "Staff" }, "order-1", "ramen", "completed").pipe(
        Effect.provide(Layer.merge(repositoryWith("cooking"), command)),
      ),
    );

    expect(execute).toHaveBeenCalledWith("staff-1", "order-1", "ramen", "cooking", "completed");
  });

  it("許可されない遷移では更新しない", async () => {
    const execute = vi.fn(() => Effect.void);
    const command = Layer.succeed(UpdateCookingStateCommand, { execute });

    const error = await Effect.runPromise(
      updateCookingState({ id: "staff-1", role: "Staff" }, "order-1", "ramen", "completed").pipe(
        Effect.flip,
        Effect.provide(Layer.merge(repositoryWith("unstarted"), command)),
      ),
    );

    expect(error).toBeInstanceOf(KitchenOrderConflict);
    expect(execute).not.toHaveBeenCalled();
  });
});
