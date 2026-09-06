import { Effect, Layer } from "effect";

import { InventoryAvailability } from "../../../inventory/public";
import { MenuItemAvailability } from "../../application/ports/outbound/menu-item-availability";

export const MenuItemAvailabilityLive = Layer.effect(
  MenuItemAvailability,
  Effect.gen(function* () {
    const inventory = yield* InventoryAvailability;

    return MenuItemAvailability.of({
      listSellability: (menuItemIds) =>
        inventory.findShortages(menuItemIds.map((menuItemId) => ({ menuItemId, quantity: 1 }))).pipe(
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
