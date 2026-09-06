import { Effect, Layer } from "effect";

import { shortagesFor } from "../../domain/stock";
import { InventoryAvailability } from "../ports/inbound/inventory-availability";
import { StockRepository } from "../ports/outbound/stock.repository";

export const InventoryAvailabilityLive = Layer.effect(
  InventoryAvailability,
  Effect.gen(function* () {
    const repository = yield* StockRepository;

    return InventoryAvailability.of({
      findShortages: (demands) => repository.listAll().pipe(Effect.map((stocks) => shortagesFor(stocks, demands))),
    });
  }),
);
