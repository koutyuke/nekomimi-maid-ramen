import { Effect, Layer, Option } from "effect";

import { OrderRepository } from "../../application/ports/order.repository";
import { Order, OrderNumber } from "../../domain/order";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { ConfirmationLostStockRace, DuplicateConfirmation, OrderDraft } from "../../domain/order";

export type ConfirmOutcome = Effect.Effect<Order, ConfirmationLostStockRace | DuplicateConfirmation | PersistenceError>;

export type OrderRepositoryMockOptions = {
  readonly confirmed?: Array<Order>;
  readonly confirm?: (draft: OrderDraft, attempt: number) => ConfirmOutcome;
};

export const orderRepositoryMock = (options: OrderRepositoryMockOptions = {}) => {
  const confirmed = options.confirmed ?? [];
  let attempts = 0;

  const defaultConfirm = (draft: OrderDraft): ConfirmOutcome =>
    Effect.sync(() => {
      const order = new Order({ ...draft, orderNumber: OrderNumber.make(confirmed.length + 1) });
      confirmed.push(order);

      return order;
    });

  return Layer.succeed(OrderRepository, {
    findByRequestId: (requestId) =>
      Effect.sync(() => Option.fromNullable(confirmed.find((order) => order.requestId === requestId))),
    confirm: (draft) => {
      attempts += 1;

      return (options.confirm ?? defaultConfirm)(draft, attempts);
    },
  });
};

export const failingOrderRepositoryMock = (error: PersistenceError) =>
  Layer.succeed(OrderRepository, {
    findByRequestId: () => Effect.fail(error),
    confirm: () => Effect.fail(error),
  });
