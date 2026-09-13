import { Effect, Option } from "effect";

import { OrderId } from "../../../../core/domain/ids";
import { canCompleteHandoff, HandoffConflict, HandoffForbidden } from "../../domain/order";
import { CompleteHandoffCommand } from "../ports/outbound/complete-handoff.command";
import { OrderUpdatesGateway } from "../ports/outbound/order-updates.gateway";
import { OrderRepository } from "../ports/outbound/order.repository";

export const completeHandoff = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  id: string,
) =>
  Effect.gen(function* () {
    if (actor.role === "None") {
      return yield* new HandoffForbidden();
    }
    const orderId = OrderId.make(id);

    const repository = yield* OrderRepository;
    const order = yield* repository.findById(orderId);
    const command = yield* CompleteHandoffCommand;
    const updates = yield* OrderUpdatesGateway;

    if (Option.isNone(order) || !canCompleteHandoff(order.value)) {
      return yield* new HandoffConflict();
    }
    const handedOffAt = yield* command.execute(actor.id, orderId);

    yield* updates.notify(["orders"]);

    return { id, handedOffAt };
  });
