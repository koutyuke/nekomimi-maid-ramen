import { Effect, Layer } from "effect";

import { MenuItemRepository } from "../../application/ports/menu-item.repository";
import type { MenuItem } from "../../domain/menu-item";

export const menuItemRepositoryMock = (menuItems: ReadonlyArray<MenuItem>) =>
  Layer.succeed(MenuItemRepository, { listInDisplayOrder: () => Effect.succeed(menuItems) });
