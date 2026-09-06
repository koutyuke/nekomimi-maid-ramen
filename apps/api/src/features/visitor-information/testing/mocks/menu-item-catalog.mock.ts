import { Effect, Layer } from "effect";

import { MenuItemCatalog } from "../../application/ports/inbound/menu-item-catalog";
import type { MenuItem } from "../../domain/menu-item";

export const menuItemCatalogMock = (menuItems: ReadonlyArray<MenuItem>) =>
  Layer.succeed(MenuItemCatalog, {
    listInDisplayOrder: () => Effect.succeed(menuItems),
    findPrices: (menuItemIds) => {
      const requestedIds = new Set(menuItemIds);

      return Effect.succeed(
        menuItems.flatMap((menuItem) =>
          requestedIds.has(menuItem.id) ? [{ menuItemId: menuItem.id, price: menuItem.price }] : [],
        ),
      );
    },
  });
