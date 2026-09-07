import { Layer } from "effect";

import { InventoryAvailabilityLive } from "./application/services/inventory-availability.live";
import { StockRepositoryLive } from "./infra/repositories/stock.repository.live";

export const InventoryLayer = InventoryAvailabilityLive.pipe(Layer.provide(StockRepositoryLive));
