import { Layer } from "effect";

import { MenuItemAvailabilityGatewayLive } from "./adapters/inventory/menu-item-availability.gateway.live";
import { MenuItemCatalogFacadeLive } from "./application/facades/menu-item-catalog.facade.live";
import { MenuItemRepositoryLive } from "./infra/repositories/menu-item.repository.live";

export const VisitorInformationLayer = Layer.mergeAll(
  MenuItemCatalogFacadeLive.pipe(Layer.provide(MenuItemRepositoryLive)),
  MenuItemAvailabilityGatewayLive,
  MenuItemRepositoryLive,
);
