import { Effect } from "effect";

import { InventoryAvailabilityFacade } from "../ports/inbound/inventory-availability.facade";
import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuEntry = {
  readonly menuItem: MenuItem;
  readonly sellable: boolean;
};

export const listMenu = (): Effect.Effect<
  ReadonlyArray<MenuEntry>,
  PersistenceError,
  InventoryAvailabilityFacade | MenuItemRepository
> =>
  Effect.gen(function* () {
    const menuItemRepository = yield* MenuItemRepository;
    const inventoryAvailabilityFacade = yield* InventoryAvailabilityFacade;

    const menuItems = yield* menuItemRepository.listInDisplayOrder();
    const shortages = yield* inventoryAvailabilityFacade.findShortages(
      menuItems.map((menuItem) => ({ menuItemId: menuItem.id, quantity: 1 })),
    );
    const unavailableMenuItemIds = new Set(shortages.map((shortage) => shortage.menuItemId));

    return menuItems.map((menuItem) => ({
      menuItem,
      sellable: !unavailableMenuItemIds.has(menuItem.id),
    }));
  });
