import { Effect, Layer } from "effect";

import { InventoryAvailabilityFacade } from "../../../inventory/public";
import { OrderStockAvailabilityGateway } from "../../application/ports/outbound/order-stock-availability.gateway";

export const OrderStockAvailabilityGatewayLive = Layer.effect(
  OrderStockAvailabilityGateway,
  Effect.gen(function* () {
    const inventoryFacade = yield* InventoryAvailabilityFacade;

    return OrderStockAvailabilityGateway.of({
      findShortages: (demands) =>
        inventoryFacade.findShortages(demands).pipe(
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
