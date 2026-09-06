import { Effect, Layer } from "effect";

import { OrderPricing } from "../../application/ports/outbound/order-pricing";
import type { MenuItemId } from "../../../../core/domain/ids";
import type { Price } from "../../../../core/domain/money";

export const orderPricingMock = (menuItems: ReadonlyArray<{ readonly id: MenuItemId; readonly price: Price }>) =>
  Layer.succeed(OrderPricing, {
    findPrices: (menuItemIds) => {
      const requestedIds = new Set(menuItemIds);

      return Effect.succeed(
        menuItems.flatMap((menuItem) =>
          requestedIds.has(menuItem.id) ? [{ menuItemId: menuItem.id, price: menuItem.price }] : [],
        ),
      );
    },
  });
