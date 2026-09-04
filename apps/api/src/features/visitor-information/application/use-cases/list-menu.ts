import { Effect } from "effect";

import { isSellable, StockRepository } from "../../../inventory";
import { MenuItemRepository } from "../ports/menu-item.repository";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuEntry = {
  readonly menuItem: MenuItem;
  readonly sellable: boolean;
};

export const listMenu = (): Effect.Effect<
  ReadonlyArray<MenuEntry>,
  PersistenceError,
  MenuItemRepository | StockRepository
> =>
  Effect.gen(function* () {
    const menuItemRepository = yield* MenuItemRepository;
    const stockRepository = yield* StockRepository;

    const [menuItems, stocks] = yield* Effect.all(
      [menuItemRepository.listInDisplayOrder(), stockRepository.listAll()],
      { concurrency: 2 },
    );

    const sellableByMenuItemId = new Map<MenuItemId, boolean>(
      stocks.map((stock) => [stock.menuItemId, isSellable(stock)]),
    );

    return menuItems.map((menuItem) => ({
      menuItem,
      sellable: sellableByMenuItemId.get(menuItem.id) ?? false,
    }));
  });
