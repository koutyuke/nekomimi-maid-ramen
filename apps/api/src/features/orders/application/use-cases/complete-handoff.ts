import { Effect } from "effect";

import { OrderId } from "../../../../core/domain/ids";
import { HandoffForbidden } from "../../domain/order";
import { CompleteHandoffCommand } from "../ports/outbound/complete-handoff.command";

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
    return { id, handedOffAt };
  });
