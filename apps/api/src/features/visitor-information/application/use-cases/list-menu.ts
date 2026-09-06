import { Effect } from "effect";

import { MenuItemCatalog } from "../ports/inbound/menu-item-catalog";
import { MenuItemAvailability } from "../ports/outbound/menu-item-availability";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuEntry = {
  readonly menuItem: MenuItem;
  readonly sellable: boolean;
};

export const listMenu = (): Effect.Effect<
  ReadonlyArray<MenuEntry>,
  PersistenceError,
  MenuItemAvailability | MenuItemCatalog
> =>
  Effect.gen(function* () {
    const menuItemCatalog = yield* MenuItemCatalog;
    const menuItemAvailability = yield* MenuItemAvailability;

    const menuItems = yield* menuItemCatalog.listInDisplayOrder();
    const sellability = yield* menuItemAvailability.listSellability(menuItems.map((menuItem) => menuItem.id));
    const sellableByMenuItemId = new Map(sellability.map((entry) => [entry.menuItemId, entry.sellable]));

    return menuItems.map((menuItem) => ({
      menuItem,
      sellable: sellableByMenuItemId.get(menuItem.id) ?? false,
    }));
  });
