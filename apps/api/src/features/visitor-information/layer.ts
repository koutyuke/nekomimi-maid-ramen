import { Layer } from "effect";

import { MenuItemAvailabilityLive } from "./adapters/inventory/menu-item-availability.live";
import { MenuItemRepositoryLive } from "./adapters/repositories/menu-item.repository.live";
import { MenuItemCatalogLive } from "./application/services/menu-item-catalog.live";

export const VisitorInformationLayer = Layer.mergeAll(
  MenuItemCatalogLive.pipe(Layer.provide(MenuItemRepositoryLive)),
  MenuItemAvailabilityLive,
);
