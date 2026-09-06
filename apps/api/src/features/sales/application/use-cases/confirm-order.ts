import { Clock, Effect, Option, ParseResult, Schema } from "effect";

import { MenuItemId, OrderId } from "../../../../core/domain/ids";
import { PersistenceError } from "../../../../core/domain/persistence-error";
import {
  businessDateAt,
  ConfirmationRequestId,
  InvalidOrderInput,
  LineQuantity,
  OrderLine,
  OutOfStock,
  totalAmountOf,
  UnknownMenuItem,
} from "../../domain/order";
import { OrderConfirmationCommit } from "../ports/outbound/order-confirmation-commit";
import { OrderPricing } from "../ports/outbound/order-pricing";
import { OrderStockAvailability } from "../ports/outbound/order-stock-availability";
import { OrderRepository } from "../ports/outbound/order.repository";
import type { Price } from "../../../../core/domain/money";
import type { Order, OrderDraft } from "../../domain/order";

const OrderLineInputSchema = Schema.Struct({ menuItemId: MenuItemId, quantity: LineQuantity });

const ConfirmOrderInputSchema = Schema.Struct({
  requestId: ConfirmationRequestId,
  lines: Schema.Array(OrderLineInputSchema).pipe(
    Schema.minItems(1),
    Schema.filter((lines) => new Set(lines.map((line) => line.menuItemId)).size === lines.length, {
      message: () => "同じ商品を複数の明細へ分けられない",
    }),
  ),
});
type ValidatedConfirmOrderInput = Schema.Schema.Type<typeof ConfirmOrderInputSchema>;

export type ConfirmOrderInput = {
  readonly requestId: string;
  readonly lines: ReadonlyArray<{ readonly menuItemId: string; readonly quantity: number }>;
};

const decodeInput = (input: ConfirmOrderInput) =>
  Schema.decodeUnknown(ConfirmOrderInputSchema)(input).pipe(
    Effect.mapError((cause) => new InvalidOrderInput({ reason: ParseResult.TreeFormatter.formatErrorSync(cause) })),
  );

const newOrderId = Effect.sync(() => OrderId.make(crypto.randomUUID()));

export const confirmOrder = (
  input: ConfirmOrderInput,
): Effect.Effect<
  Order,
  InvalidOrderInput | OutOfStock | PersistenceError | UnknownMenuItem,
  OrderConfirmationCommit | OrderPricing | OrderRepository | OrderStockAvailability
> =>
  Effect.gen(function* () {
    const orderPricing = yield* OrderPricing;
    const stockAvailability = yield* OrderStockAvailability;
    const orderRepository = yield* OrderRepository;
    const orderConfirmationCommit = yield* OrderConfirmationCommit;

    const validatedInput = yield* decodeInput(input);
    const alreadyConfirmed = yield* orderRepository.findByRequestId(validatedInput.requestId);

    if (Option.isSome(alreadyConfirmed)) {
      return alreadyConfirmed.value;
    }

    const [prices, shortages] = yield* Effect.all(
      [
        orderPricing.findPrices(validatedInput.lines.map((line) => line.menuItemId)),
        stockAvailability.findShortages(validatedInput.lines),
      ],
      { concurrency: 2 },
    );

    const priceByMenuItemId = new Map<MenuItemId, Price>(prices.map((price) => [price.menuItemId, price.price]));
    const unknownMenuItemIds = validatedInput.lines.flatMap((line) =>
      priceByMenuItemId.has(line.menuItemId) ? [] : [line.menuItemId],
    );
    if (unknownMenuItemIds.length > 0) {
      return yield* new UnknownMenuItem({ menuItemIds: unknownMenuItemIds });
    }

    if (shortages.length > 0) {
      return yield* new OutOfStock({ shortages });
    }

    const lines = validatedInput.lines.flatMap((line) => {
      const unitPrice = priceByMenuItemId.get(line.menuItemId);

      return unitPrice === undefined ? [] : [new OrderLine({ ...line, unitPrice })];
    });

    const confirmedAt = new Date(yield* Clock.currentTimeMillis);
    const draft: OrderDraft = {
      id: yield* newOrderId,
      businessDate: businessDateAt(confirmedAt),
      requestId: validatedInput.requestId,
      lines,
      totalAmount: totalAmountOf(lines),
      cookingState: "unstarted",
      confirmedAt,
    };

    return yield* orderConfirmationCommit.commit(draft).pipe(
      Effect.catchTag("DuplicateConfirmation", () => reloadConfirmed(validatedInput.requestId)),
      Effect.catchTag("ConfirmationLostStockRace", () => reportShortagesAfterRace(validatedInput)),
    );
  });

const reloadConfirmed = (requestId: ConfirmationRequestId): Effect.Effect<Order, PersistenceError, OrderRepository> =>
  Effect.gen(function* () {
    const orderRepository = yield* OrderRepository;
    const confirmed = yield* orderRepository.findByRequestId(requestId);

    return yield* Option.match(confirmed, {
      onNone: () =>
        Effect.fail(new PersistenceError({ operation: "再送された注文の読み出し", cause: new Error(requestId) })),
      onSome: Effect.succeed,
    });
  });

const reportShortagesAfterRace = (
  input: ValidatedConfirmOrderInput,
): Effect.Effect<never, OutOfStock | PersistenceError, OrderStockAvailability> =>
  Effect.gen(function* () {
    const stockAvailability = yield* OrderStockAvailability;
    const shortages = yield* stockAvailability.findShortages(input.lines);

    return yield* new OutOfStock({ shortages });
  });
