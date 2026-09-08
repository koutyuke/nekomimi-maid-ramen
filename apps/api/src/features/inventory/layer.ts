import { Layer } from "effect";

import { InventoryAvailabilityFacadeLive } from "./application/facades/inventory-availability.facade.live";
import { StockRepositoryLive } from "./infra/repositories/stock.repository.live";

export const InventoryLayer = InventoryAvailabilityFacadeLive.pipe(Layer.provide(StockRepositoryLive));
