import { Context } from "effect";
import type { Effect } from "effect";

import type { CookingState } from "../../../../../core/domain/cooking-state";
import type { MenuItemId, OrderId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { KitchenOrderConflict } from "../../../domain/order";

export class UpdateCookingStateCommand extends Context.Tag("UpdateCookingStateCommand")<
  UpdateCookingStateCommand,
  {
    readonly execute: (
      actorId: string,
      id: OrderId,
      menuItemId: MenuItemId,
      from: CookingState,
      to: CookingState,
    ) => Effect.Effect<void, PersistenceError | KitchenOrderConflict>;
  }
>() {}
