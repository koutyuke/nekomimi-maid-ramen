import { Layer } from "effect";

import { MenuItemAvailabilityLive } from "./adapters/inventory/menu-item-availability.live";
import { MenuItemCatalogLive } from "./application/services/menu-item-catalog.live";
import { MenuItemRepositoryLive } from "./infra/repositories/menu-item.repository.live";

export const VisitorInformationLayer = Layer.mergeAll(
  MenuItemCatalogLive.pipe(Layer.provide(MenuItemRepositoryLive)),
  MenuItemAvailabilityLive,
);
