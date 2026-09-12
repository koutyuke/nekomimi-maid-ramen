import { Context } from "effect";
import type { Effect } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Snapshot } from "../../../../../core/domain/revision";
import type { MenuItem } from "../../../domain/menu-item";

export type MenuInventoryEntry = { readonly menuItem: MenuItem; readonly quantity: number };

export class MenuItemRepository extends Context.Tag("MenuItemRepository")<
  MenuItemRepository,
  {
    readonly findMany: () => Effect.Effect<Snapshot<readonly MenuInventoryEntry[]>, PersistenceError>;
    readonly getRevision: () => Effect.Effect<number, PersistenceError>;
  }
>() {}
