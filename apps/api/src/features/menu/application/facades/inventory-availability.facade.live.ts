import { Effect, Layer } from "effect";

import { shortagesFor } from "../../domain/stock";
import { InventoryAvailabilityFacade } from "../ports/inbound/inventory-availability.facade";
import { StockRepository } from "../ports/outbound/stock.repository";

export const InventoryAvailabilityFacadeLive = Layer.effect(
  InventoryAvailabilityFacade,
  Effect.gen(function* () {
    const repository = yield* StockRepository;

    return InventoryAvailabilityFacade.of({
      findShortages: (demands) => repository.findMany().pipe(Effect.map((stocks) => shortagesFor(stocks, demands))),
    });
  }),
);
