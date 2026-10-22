import { Effect } from "effect";

import { canChangePrice, MenuPriceChangeForbidden } from "../../domain/menu-item";
import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import { MenuUpdatesGateway } from "../ports/outbound/menu-updates.gateway";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { Price } from "../../../../core/domain/money";

export const changeMenuPrice = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  menuItemId: MenuItemId,
  price: Price,
) =>
  Effect.gen(function* () {
    if (!canChangePrice(actor.role)) {
      return yield* new MenuPriceChangeForbidden();
    }

    const repository = yield* MenuItemRepository;
    const updates = yield* MenuUpdatesGateway;

    const change = yield* repository.changePrice(actor.id, menuItemId, price);
    if (change.changed) {
      yield* updates.notify();
    }

    return change;
  });
