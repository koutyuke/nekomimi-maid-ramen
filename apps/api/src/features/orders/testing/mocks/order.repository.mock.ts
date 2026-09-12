import { Effect, Layer, Option } from "effect";

import { OrderConfirmationCommand } from "../../application/ports/outbound/order-confirmation.command";
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
    findLine: (id, menuItemId) =>
      Effect.sync(() =>
        Option.fromNullable(
          confirmed.find((order) => order.id === id)?.lines.find((line) => line.menuItemId === menuItemId),
        ),
      ),
    findByRequestId: (requestId) =>
      Effect.sync(() => Option.fromNullable(confirmed.find((order) => order.requestId === requestId))),
    list: () => Effect.die("Unexpected order listing"),
  });
  const confirmation = Layer.succeed(OrderConfirmationCommand, {
    execute: (draft) => {
      attempts += 1;

      return (options.confirm ?? defaultConfirm)(draft, attempts);
    },
  });

  return Layer.mergeAll(repository, confirmation);
};

export const failingOrderRepositoryMock = (error: PersistenceError) =>
  Layer.mergeAll(
    Layer.succeed(OrderRepository, {
      findLine: () => Effect.fail(error),
      findByRequestId: () => Effect.fail(error),
      list: () => Effect.fail(error),
    }),
    Layer.succeed(OrderConfirmationCommand, { execute: () => Effect.fail(error) }),
  );
