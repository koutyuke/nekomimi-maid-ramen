import { Effect, Layer } from "effect";

import { MenuItemCatalogFacade } from "../../application/ports/inbound/menu-item-catalog.facade";
import type { MenuItem } from "../../domain/menu-item";

export const menuItemCatalogFacadeMock = (menuItems: ReadonlyArray<MenuItem>) =>
  Layer.succeed(MenuItemCatalogFacade, {
    findPrices: (menuItemIds) => {
      const requestedIds = new Set(menuItemIds);

      return Effect.succeed(
        menuItems.flatMap((menuItem) =>
          requestedIds.has(menuItem.id) ? [{ menuItemId: menuItem.id, price: menuItem.price }] : [],
        ),
      );
    },
  });
