import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { Price } from "../../../../../core/domain/money";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Snapshot } from "../../../../../core/domain/revision";
import type { MenuItem, MenuItemNotFound, MenuPriceChange, MenuPriceChangeForbidden } from "../../../domain/menu-item";

export type MenuInventoryEntry = { readonly menuItem: MenuItem; readonly quantity: number };

export class MenuItemRepository extends Context.Tag("MenuItemRepository")<
  MenuItemRepository,
  {
    readonly findMany: () => Effect.Effect<Snapshot<readonly MenuInventoryEntry[]>, PersistenceError>;
    readonly getRevision: () => Effect.Effect<number, PersistenceError>;
    readonly changePrice: (
      actorId: string,
      menuItemId: MenuItemId,
      price: Price,
    ) => Effect.Effect<MenuPriceChange, MenuItemNotFound | MenuPriceChangeForbidden | PersistenceError>;
  }
>() {}
