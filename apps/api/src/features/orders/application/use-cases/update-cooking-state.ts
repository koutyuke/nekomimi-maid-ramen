import { Effect, Option } from "effect";

import { MenuItemId, OrderId } from "../../../../core/domain/ids";
import { canUpdateCookingState, KitchenForbidden, KitchenOrderConflict } from "../../domain/order";
import { OrderUpdatesGateway } from "../ports/outbound/order-updates.gateway";
import { OrderRepository } from "../ports/outbound/order.repository";
import { UpdateCookingStateCommand } from "../ports/outbound/update-cooking-state.command";
import type { CookingState } from "../../../../core/domain/cooking-state";

export const updateCookingState = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  id: string,
  menuItemId: string,
  to: CookingState,
) =>
  Effect.gen(function* () {
    if (actor.role === "None") {
      return yield* new KitchenForbidden();
    }
    const orderId = OrderId.make(id);
    const itemId = MenuItemId.make(menuItemId);

    const repository = yield* OrderRepository;
    const updates = yield* OrderUpdatesGateway;
    const command = yield* UpdateCookingStateCommand;

    const order = yield* repository.findById(orderId);
    const line = Option.isSome(order)
      ? order.value.lines.find((candidate) => candidate.menuItemId === itemId)
      : undefined;

    if (Option.isNone(order) || line === undefined || !canUpdateCookingState(order.value, line.cookingState, to)) {
      return yield* new KitchenOrderConflict();
    }

    yield* command.execute(actor.id, orderId, itemId, line.cookingState, to);

    yield* updates.notify(["orders"]);

    return {
      id,
      menuItemId,
      cookingState: to,
    };
  });
