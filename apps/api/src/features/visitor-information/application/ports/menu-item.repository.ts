import { Context, type Effect } from "effect";

import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItem } from "../../domain/menu-item";

export type MenuItemRepositoryService = {
  readonly listInDisplayOrder: () => Effect.Effect<ReadonlyArray<MenuItem>, PersistenceError>;
};

export class MenuItemRepository extends Context.Tag("MenuItemRepository")<
  MenuItemRepository,
  MenuItemRepositoryService
>() {}
