import { Effect, Layer } from "effect";

import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";
import type { Stock } from "../../domain/stock";

export const menuItemRepositoryMock = (menuItems: readonly MenuItem[], stocks: readonly Stock[] = []) =>
  Layer.succeed(MenuItemRepository, {
    list: () =>
      Effect.succeed({
        data: menuItems.map((menuItem) => ({
          menuItem,
          quantity: stocks.find((stock) => stock.menuItemId === menuItem.id)?.quantity ?? 0,
        })),
        revision: 0,
      }),
    getRevision: () => Effect.succeed(0),
  });

export const failingMenuItemRepositoryMock = (error: PersistenceError) =>
  Layer.succeed(MenuItemRepository, { list: () => Effect.fail(error), getRevision: () => Effect.fail(error) });
