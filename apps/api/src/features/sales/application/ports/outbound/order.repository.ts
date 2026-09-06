import { Context } from "effect";
import type { Effect, Option } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { ConfirmationRequestId, Order } from "../../../domain/order";

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  {
    readonly findByRequestId: (
      requestId: ConfirmationRequestId,
    ) => Effect.Effect<Option.Option<Order>, PersistenceError>;
  }
>() {}
