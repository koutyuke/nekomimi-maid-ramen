import { Layer } from "effect";

import { InventoryAvailabilityFacadeLive } from "./application/facades/inventory-availability.facade.live";
import { MenuItemCatalogFacadeLive } from "./application/facades/menu-item-catalog.facade.live";
import { MenuItemRepositoryLive } from "./infra/repositories/menu-item.repository.live";
import { StockRepositoryLive } from "./infra/repositories/stock.repository.live";

export const MenuLayer = Layer.mergeAll(
  InventoryAvailabilityFacadeLive.pipe(Layer.provide(StockRepositoryLive)),
  MenuItemCatalogFacadeLive.pipe(Layer.provide(MenuItemRepositoryLive)),
  MenuItemRepositoryLive,
);
