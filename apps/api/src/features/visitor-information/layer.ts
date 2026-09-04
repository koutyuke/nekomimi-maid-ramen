import { Layer } from "effect";

import { MenuItemRepositoryLive } from "./adapters/repositories/menu-item.repository.live";

export const VisitorInformationLayer = Layer.mergeAll(MenuItemRepositoryLive);
