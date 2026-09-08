import { Effect, Layer } from "effect";

import { InventoryAvailabilityFacade } from "../../application/ports/inbound/inventory-availability.facade";
import { shortagesFor } from "../../domain/stock";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export const inventoryAvailabilityFacadeMock = (stocks: ReadonlyArray<Stock>) =>
  Layer.succeed(InventoryAvailabilityFacade, {
    findShortages: (demands) => Effect.succeed(shortagesFor(stocks, demands)),
  });

export const inventoryAvailabilityFacadeSequenceMock = (snapshots: ReadonlyArray<ReadonlyArray<Stock>>) => {
  let attempt = 0;

  return Layer.succeed(InventoryAvailabilityFacade, {
    findShortages: (demands) => {
      const stocks = snapshots[Math.min(attempt++, snapshots.length - 1)] ?? [];

      return Effect.succeed(shortagesFor(stocks, demands));
    },
  });
};

export const failingInventoryAvailabilityFacadeMock = (error: PersistenceError) =>
  Layer.succeed(InventoryAvailabilityFacade, { findShortages: () => Effect.fail(error) });
