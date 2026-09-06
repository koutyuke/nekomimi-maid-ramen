import { Effect, Layer } from "effect";

import { InventoryAvailability } from "../../../inventory/public";
import { OrderStockAvailability } from "../../application/ports/outbound/order-stock-availability";

export const OrderStockAvailabilityLive = Layer.effect(
  OrderStockAvailability,
  Effect.gen(function* () {
    const inventory = yield* InventoryAvailability;

    return OrderStockAvailability.of({
      findShortages: (demands) =>
        inventory.findShortages(demands).pipe(
          Effect.map((shortages) =>
            shortages.map((shortage) => ({
              menuItemId: shortage.menuItemId,
              requested: shortage.requested,
              available: shortage.available,
            })),
          ),
        ),
    });
  }),
);
