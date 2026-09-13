import { Effect, Option } from "effect";

import { OrderId } from "../../../../core/domain/ids";
import { canCancelOrder, OrderCancellationConflict, OrderCancellationForbidden } from "../../domain/order";
import { CancelOrderCommand } from "../ports/outbound/cancel-order.command";
import { OrderUpdatesGateway } from "../ports/outbound/order-updates.gateway";
import { OrderRepository } from "../ports/outbound/order.repository";

export const cancelOrder = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  id: string,
) =>
  Effect.gen(function* () {
    if (actor.role === "None") {
      return yield* new OrderCancellationForbidden();
    }

    const orderId = OrderId.make(id);
    const repository = yield* OrderRepository;
    const order = yield* repository.findById(orderId);
    const updates = yield* OrderUpdatesGateway;
    const command = yield* CancelOrderCommand;

    if (Option.isNone(order) || !canCancelOrder(order.value)) {
      return yield* new OrderCancellationConflict();
    }

    const cancelledAt = yield* command.execute(actor.id, orderId);
    yield* updates.notify(["orders", "menu"]);

    return { id, cancelledAt, cancelledBy: actor.id };
  });
