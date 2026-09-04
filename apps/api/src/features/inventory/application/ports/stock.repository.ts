import { Context, type Effect } from "effect";

import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export class StockRepository extends Context.Tag("StockRepository")<
  StockRepository,
  {
    readonly listAll: () => Effect.Effect<ReadonlyArray<Stock>, PersistenceError>;
  }
>() {}
