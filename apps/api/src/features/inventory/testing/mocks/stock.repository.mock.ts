import { Effect, Layer } from "effect";

import { StockRepository } from "../../application/ports/stock.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export const stockRepositoryMock = (stocks: ReadonlyArray<Stock>) =>
  Layer.succeed(StockRepository, { listAll: () => Effect.succeed(stocks) });

export const failingStockRepositoryMock = (error: PersistenceError) =>
  Layer.succeed(StockRepository, { listAll: () => Effect.fail(error) });
