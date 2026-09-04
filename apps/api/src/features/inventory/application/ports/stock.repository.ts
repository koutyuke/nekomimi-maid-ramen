import { Context, type Effect } from "effect";

import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export type StockRepositoryService = {
  readonly listAll: () => Effect.Effect<ReadonlyArray<Stock>, PersistenceError>;
};

export class StockRepository extends Context.Tag("StockRepository")<StockRepository, StockRepositoryService>() {}
