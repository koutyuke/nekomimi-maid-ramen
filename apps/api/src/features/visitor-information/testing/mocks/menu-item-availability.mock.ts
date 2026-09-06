import { Effect, Layer } from "effect";

import { MenuItemAvailability } from "../../application/ports/outbound/menu-item-availability";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { MenuItemSellability } from "../../application/ports/outbound/menu-item-availability";

export const menuItemAvailabilityMock = (sellability: ReadonlyArray<MenuItemSellability>) =>
  Layer.succeed(MenuItemAvailability, {
    listSellability: () => Effect.succeed(sellability),
  });

export const failingMenuItemAvailabilityMock = (error: PersistenceError) =>
  Layer.succeed(MenuItemAvailability, { listSellability: () => Effect.fail(error) });
