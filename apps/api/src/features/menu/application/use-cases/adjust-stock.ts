import { Effect } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { canAdjustStock, StockAdjustmentForbidden } from "../../domain/stock";
import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import { MenuUpdatesGateway } from "../ports/outbound/menu-updates.gateway";
import { StockRepository } from "../ports/outbound/stock.repository";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { StockQuantity } from "../../domain/stock";

export const adjustStock = (
  actor: { readonly id: string; readonly role: "Owner" | "Admin" | "Staff" | "None" },
  menuItemId: MenuItemId,
  quantity: StockQuantity,
) =>
  Effect.gen(function* () {
    if (!canAdjustStock(actor.role)) {
      return yield* new StockAdjustmentForbidden();
    }

    const catalog = yield* MenuItemRepository;
    const { data } = yield* catalog.findMany();
    if (!data.some(({ menuItem }) => menuItem.id === menuItemId)) {
      return yield* new PersistenceError({ operation: "在庫の修正", cause: new Error("対象の商品がありません") });
    }

    const repository = yield* StockRepository;
    const updates = yield* MenuUpdatesGateway;

    const adjustment = yield* repository.adjust(actor.id, menuItemId, quantity);
    yield* Effect.logInfo("在庫を修正した").pipe(
      Effect.annotateLogs({
        operation: "stock.adjust",
        menuItemId: adjustment.menuItemId,
        previousQuantity: adjustment.previousQuantity,
        quantity: adjustment.quantity,
        adjustedBy: adjustment.adjustedBy,
        adjustedAt: adjustment.adjustedAt.toISOString(),
      }),
    );
    yield* updates.notify();

    return adjustment;
  });
