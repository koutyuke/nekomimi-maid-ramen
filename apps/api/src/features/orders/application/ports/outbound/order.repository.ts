import { Context } from "effect";
import type { Effect, Option } from "effect";

import type { MenuItemId, OrderId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Snapshot } from "../../../../../core/domain/revision";
import type { ConfirmationRequestId, OperationalOrder, Order, OrderLine } from "../../../domain/order";

export type OrderLookup = { readonly businessDate: string };

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  {
    readonly findLine: (
      id: OrderId,
      menuItemId: MenuItemId,
    ) => Effect.Effect<Option.Option<OrderLine>, PersistenceError>;
    readonly findByRequestId: (
      requestId: ConfirmationRequestId,
    ) => Effect.Effect<Option.Option<Order>, PersistenceError>;
    readonly getRevision: () => Effect.Effect<number, PersistenceError>;
    readonly findMany: (lookup?: OrderLookup) => Effect.Effect<Snapshot<readonly OperationalOrder[]>, PersistenceError>;
  }
>() {}
