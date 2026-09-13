import { Effect } from "effect";

import { MenuUpdatesGateway } from "../ports/outbound/menu-updates.gateway";
import { StockRepository } from "../ports/outbound/stock.repository";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { StockQuantity } from "../../domain/stock";

export const adjustStock = (actorId: string, menuItemId: MenuItemId, quantity: StockQuantity) =>
  Effect.gen(function* () {
    const repository = yield* StockRepository;
    const updates = yield* MenuUpdatesGateway;

    const adjustment = yield* repository.adjust(actorId, menuItemId, quantity);
    yield* updates.notify();

    return adjustment;
  });
