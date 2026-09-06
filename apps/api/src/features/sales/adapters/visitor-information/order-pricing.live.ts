import { Effect, Layer } from "effect";

import { MenuItemCatalog } from "../../../visitor-information/public";
import { OrderPricing } from "../../application/ports/outbound/order-pricing";

export const OrderPricingLive = Layer.effect(
  OrderPricing,
  Effect.gen(function* () {
    const menuItemCatalog = yield* MenuItemCatalog;

    return OrderPricing.of({
      findPrices: (menuItemIds) => menuItemCatalog.findPrices(menuItemIds),
    });
  }),
);
