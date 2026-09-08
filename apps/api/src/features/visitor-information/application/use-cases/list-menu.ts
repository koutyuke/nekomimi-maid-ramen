import { Effect } from "effect";

import { MenuItemAvailabilityGateway } from "../ports/outbound/menu-item-availability.gateway";
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
  MenuItemAvailabilityGateway | MenuItemRepository
> =>
  Effect.gen(function* () {
    const menuItemRepository = yield* MenuItemRepository;
    const menuItemAvailabilityGateway = yield* MenuItemAvailabilityGateway;

    const menuItems = yield* menuItemRepository.listInDisplayOrder();
    const sellability = yield* menuItemAvailabilityGateway.listSellability(menuItems.map((menuItem) => menuItem.id));
    const sellableByMenuItemId = new Map(sellability.map((entry) => [entry.menuItemId, entry.sellable]));

    return menuItems.map((menuItem) => ({
      menuItem,
      sellable: sellableByMenuItemId.get(menuItem.id) ?? false,
    }));
  });
