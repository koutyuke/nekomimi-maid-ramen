import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Stock, StockAdjustment, StockQuantity } from "../../../domain/stock";

export class StockRepository extends Context.Tag("StockRepository")<
  StockRepository,
  {
    readonly findMany: () => Effect.Effect<ReadonlyArray<Stock>, PersistenceError>;
    readonly adjust: (
      actorId: string,
      menuItemId: MenuItemId,
      quantity: StockQuantity,
    ) => Effect.Effect<StockAdjustment, PersistenceError>;
  }
>() {}
