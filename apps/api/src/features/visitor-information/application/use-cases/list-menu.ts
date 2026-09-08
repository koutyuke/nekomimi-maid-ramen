import { Effect } from "effect";

import { MenuItemCatalogFacade } from "../ports/inbound/menu-item-catalog.facade";
import { MenuItemAvailabilityGateway } from "../ports/outbound/menu-item-availability.gateway";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuEntry = {
  readonly menuItem: MenuItem;
  readonly sellable: boolean;
};

export const listMenu = (): Effect.Effect<
  ReadonlyArray<MenuEntry>,
  PersistenceError,
  MenuItemAvailabilityGateway | MenuItemCatalogFacade
> =>
  Effect.gen(function* () {
    const menuItemCatalogFacade = yield* MenuItemCatalogFacade;
    const menuItemAvailabilityGateway = yield* MenuItemAvailabilityGateway;

    const menuItems = yield* menuItemCatalogFacade.listInDisplayOrder();
    const sellability = yield* menuItemAvailabilityGateway.listSellability(menuItems.map((menuItem) => menuItem.id));
    const sellableByMenuItemId = new Map(sellability.map((entry) => [entry.menuItemId, entry.sellable]));

    return menuItems.map((menuItem) => ({
      menuItem,
      sellable: sellableByMenuItemId.get(menuItem.id) ?? false,
    }));
  });
