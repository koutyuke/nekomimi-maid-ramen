import { Effect } from "effect";

import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuEntry = {
  readonly menuItem: MenuItem;
  readonly sellable: boolean;
};

export const listMenu = (): Effect.Effect<readonly MenuEntry[], PersistenceError, MenuItemRepository> =>
  Effect.gen(function* () {
    const repository = yield* MenuItemRepository;
    const snapshot = yield* repository.findMany();
    return snapshot.data.map(({ menuItem, quantity }) => ({
      menuItem,
      sellable: quantity > 0,
    }));
  });
