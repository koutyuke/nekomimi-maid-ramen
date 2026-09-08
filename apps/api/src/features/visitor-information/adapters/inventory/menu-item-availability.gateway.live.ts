import { Effect, Layer } from "effect";

import { InventoryAvailabilityFacade } from "../../../inventory/public";
import { MenuItemAvailabilityGateway } from "../../application/ports/outbound/menu-item-availability.gateway";

export const MenuItemAvailabilityGatewayLive = Layer.effect(
  MenuItemAvailabilityGateway,
  Effect.gen(function* () {
    const inventoryFacade = yield* InventoryAvailabilityFacade;

    return MenuItemAvailabilityGateway.of({
      listSellability: (menuItemIds) =>
        inventoryFacade.findShortages(menuItemIds.map((menuItemId) => ({ menuItemId, quantity: 1 }))).pipe(
          Effect.map((shortages) => {
            const shortageIds = new Set(shortages.map((shortage) => shortage.menuItemId));

            return menuItemIds.map((menuItemId) => ({
              menuItemId,
              sellable: !shortageIds.has(menuItemId),
            }));
          }),
        ),
    });
  }),
);
