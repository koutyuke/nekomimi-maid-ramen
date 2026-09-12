import { Context } from "effect";
import type { Effect } from "effect";

import type { OrderId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { HandoffConflict } from "../../../domain/order";

export class CompleteHandoffCommand extends Context.Tag("CompleteHandoffCommand")<
  CompleteHandoffCommand,
  {
    readonly execute: (actorId: string, id: OrderId) => Effect.Effect<Date, PersistenceError | HandoffConflict>;
  }
>() {}
