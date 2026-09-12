import { Effect } from "effect";

import { OrderId } from "../../../../core/domain/ids";
import { HandoffForbidden } from "../../domain/order";
import { CompleteHandoffCommand } from "../ports/outbound/complete-handoff.command";
import { OrderUpdatesGateway } from "../ports/outbound/order-updates.gateway";

export const completeHandoff = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  id: string,
) =>
  Effect.gen(function* () {
    if (actor.role === "None") {
      return yield* new HandoffForbidden();
    }
    const command = yield* CompleteHandoffCommand;
    const handedOffAt = yield* command.execute(actor.id, OrderId.make(id));
    const updates = yield* OrderUpdatesGateway;

    yield* updates.notify(["orders"]);

    return { id, handedOffAt };
  });
