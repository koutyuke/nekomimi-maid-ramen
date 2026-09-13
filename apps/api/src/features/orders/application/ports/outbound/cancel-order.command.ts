import { Context } from "effect";
import type { Effect } from "effect";

import type { OrderId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { OrderCancellationConflict } from "../../../domain/order";

export class CancelOrderCommand extends Context.Tag("CancelOrderCommand")<
  CancelOrderCommand,
  {
    readonly execute: (
      actorId: string,
      id: OrderId,
    ) => Effect.Effect<Date, PersistenceError | OrderCancellationConflict>;
  }
>() {}
