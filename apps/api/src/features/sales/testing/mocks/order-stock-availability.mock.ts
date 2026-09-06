import { Effect, Layer } from "effect";

import { OrderStockAvailability } from "../../application/ports/outbound/order-stock-availability";
import type { MenuItemId } from "../../../../core/domain/ids";

type StockSnapshot = ReadonlyArray<{ readonly menuItemId: MenuItemId; readonly quantity: number }>;

const findShortages = (stocks: StockSnapshot, demands: ReadonlyArray<{ menuItemId: MenuItemId; quantity: number }>) => {
  const availableByMenuItemId = new Map(stocks.map((stock) => [stock.menuItemId, stock.quantity]));

  return demands.flatMap((demand) => {
    const available = availableByMenuItemId.get(demand.menuItemId) ?? 0;

    return available < demand.quantity
      ? [{ menuItemId: demand.menuItemId, requested: demand.quantity, available }]
      : [];
  });
};

export const orderStockAvailabilityMock = (stocks: StockSnapshot) =>
  Layer.succeed(OrderStockAvailability, {
    findShortages: (demands) => Effect.succeed(findShortages(stocks, demands)),
  });

export const orderStockAvailabilitySequenceMock = (snapshots: ReadonlyArray<StockSnapshot>) => {
  let attempt = 0;

  return Layer.succeed(OrderStockAvailability, {
    findShortages: (demands) => {
      const stocks = snapshots[Math.min(attempt++, snapshots.length - 1)] ?? [];

      return Effect.succeed(findShortages(stocks, demands));
    },
  });
};
