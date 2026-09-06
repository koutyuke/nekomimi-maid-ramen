import { Layer } from "effect";

import { StockRepositoryLive } from "./adapters/repositories/stock.repository.live";
import { InventoryAvailabilityLive } from "./application/services/inventory-availability.live";

export const InventoryLayer = InventoryAvailabilityLive.pipe(Layer.provide(StockRepositoryLive));
