import { Context } from "effect";
import type { Effect } from "effect";

import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export class MenuItemRepository extends Context.Tag("MenuItemRepository")<
  MenuItemRepository,
  {
    readonly listInDisplayOrder: () => Effect.Effect<ReadonlyArray<MenuItem>, PersistenceError>;
  }
>() {}
