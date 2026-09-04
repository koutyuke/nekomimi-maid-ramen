import { Layer } from "effect";

import { StockRepositoryLive } from "./adapters/repositories/stock.repository.live";

export const InventoryLayer = Layer.mergeAll(StockRepositoryLive);
