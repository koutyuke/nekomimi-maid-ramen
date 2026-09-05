import { Clock, Effect, Option, ParseResult, Schema } from "effect";

import { MenuItemId, OrderId } from "../../../../core/domain/ids";
import { PersistenceError } from "../../../../core/domain/persistence-error";
import { OutOfStock, shortagesFor, StockRepository } from "../../../inventory";
import { MenuItemRepository } from "../../../visitor-information";
import {
  businessDateAt,
  ConfirmationRequestId,
  InvalidOrderInput,
  LineQuantity,
  OrderLine,
  totalAmountOf,
  UnknownMenuItem,
} from "../../domain/order";
import { OrderRepository } from "../ports/order.repository";
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
  MenuItemRepository | OrderRepository | StockRepository
> =>
  Effect.gen(function* () {
    const menuItemRepository = yield* MenuItemRepository;
    const stockRepository = yield* StockRepository;
    const orderRepository = yield* OrderRepository;

    const validatedInput = yield* decodeInput(input);
    const alreadyConfirmed = yield* orderRepository.findByRequestId(validatedInput.requestId);

    if (Option.isSome(alreadyConfirmed)) {
      return alreadyConfirmed.value;
    }

    const [menuItems, stocks] = yield* Effect.all(
      [menuItemRepository.listInDisplayOrder(), stockRepository.listAll()],
      { concurrency: 2 },
    );

    // 未知の商品が購入対象に入っていないかの確認
    // 販売可能かどうかの突合確認
    const priceByMenuItemId = new Map<MenuItemId, Price>(menuItems.map((menuItem) => [menuItem.id, menuItem.price]));
    const unknownMenuItemIds = validatedInput.lines.flatMap((line) =>
      priceByMenuItemId.has(line.menuItemId) ? [] : [line.menuItemId],
    );
    if (unknownMenuItemIds.length > 0) {
      return yield* new UnknownMenuItem({ menuItemIds: unknownMenuItemIds });
    }

    // 不足している商品がないかの確認
    const shortages = shortagesFor(stocks, validatedInput.lines);
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

    return yield* orderRepository.confirm(draft).pipe(
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
): Effect.Effect<never, OutOfStock | PersistenceError, StockRepository> =>
  Effect.gen(function* () {
    const stockRepository = yield* StockRepository;
    const stocks = yield* stockRepository.listAll();

    return yield* new OutOfStock({ shortages: shortagesFor(stocks, input.lines) });
  });
