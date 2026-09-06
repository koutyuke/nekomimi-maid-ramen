import { Effect, Layer, Option } from "effect";

import { OrderConfirmationCommit } from "../../application/ports/outbound/order-confirmation-commit";
import { OrderRepository } from "../../application/ports/outbound/order.repository";
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

  const repository = Layer.succeed(OrderRepository, {
    findByRequestId: (requestId) =>
      Effect.sync(() => Option.fromNullable(confirmed.find((order) => order.requestId === requestId))),
  });
  const confirmation = Layer.succeed(OrderConfirmationCommit, {
    commit: (draft) => {
      attempts += 1;

      return (options.confirm ?? defaultConfirm)(draft, attempts);
    },
  });

  return Layer.mergeAll(repository, confirmation);
};

export const failingOrderRepositoryMock = (error: PersistenceError) =>
  Layer.mergeAll(
    Layer.succeed(OrderRepository, { findByRequestId: () => Effect.fail(error) }),
    Layer.succeed(OrderConfirmationCommit, { commit: () => Effect.fail(error) }),
  );
