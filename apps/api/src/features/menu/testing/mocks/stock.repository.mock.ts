import { Effect, Layer } from "effect";

import { StockRepository } from "../../application/ports/outbound/stock.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Stock } from "../../domain/stock";

export const stockRepositoryMock = (stocks: ReadonlyArray<Stock>) =>
  Layer.succeed(StockRepository, { findMany: () => Effect.succeed(stocks) });

export const failingStockRepositoryMock = (error: PersistenceError) =>
  Layer.succeed(StockRepository, { findMany: () => Effect.fail(error) });
