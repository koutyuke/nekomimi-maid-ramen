import { Effect, Layer } from "effect";

import { InventoryAvailability } from "../../application/ports/inbound/inventory-availability";
import { shortagesFor } from "../../domain/stock";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export const inventoryAvailabilityMock = (stocks: ReadonlyArray<Stock>) =>
  Layer.succeed(InventoryAvailability, {
    findShortages: (demands) => Effect.succeed(shortagesFor(stocks, demands)),
  });

export const inventoryAvailabilitySequenceMock = (snapshots: ReadonlyArray<ReadonlyArray<Stock>>) => {
  let attempt = 0;

  return Layer.succeed(InventoryAvailability, {
    findShortages: (demands) => {
      const stocks = snapshots[Math.min(attempt++, snapshots.length - 1)] ?? [];

      return Effect.succeed(shortagesFor(stocks, demands));
    },
  });
};

export const failingInventoryAvailabilityMock = (error: PersistenceError) =>
  Layer.succeed(InventoryAvailability, { findShortages: () => Effect.fail(error) });
