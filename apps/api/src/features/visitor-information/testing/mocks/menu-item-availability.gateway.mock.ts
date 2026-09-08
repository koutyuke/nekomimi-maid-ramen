import { Effect, Layer } from "effect";

import { MenuItemAvailabilityGateway } from "../../application/ports/outbound/menu-item-availability.gateway";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItemSellability } from "../../application/ports/outbound/menu-item-availability.gateway";

export const menuItemAvailabilityGatewayMock = (sellability: ReadonlyArray<MenuItemSellability>) =>
  Layer.succeed(MenuItemAvailabilityGateway, {
    listSellability: () => Effect.succeed(sellability),
  });

export const failingMenuItemAvailabilityGatewayMock = (error: PersistenceError) =>
  Layer.succeed(MenuItemAvailabilityGateway, { listSellability: () => Effect.fail(error) });
