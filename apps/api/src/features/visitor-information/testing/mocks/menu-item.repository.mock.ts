import { Effect, Layer } from "effect";

import { MenuItemRepository } from "../../application/ports/outbound/menu-item.repository";
import type { MenuItem } from "../../domain/menu-item";

export const menuItemRepositoryMock = (menuItems: ReadonlyArray<MenuItem>) =>
  Layer.succeed(MenuItemRepository, { listInDisplayOrder: () => Effect.succeed(menuItems) });
