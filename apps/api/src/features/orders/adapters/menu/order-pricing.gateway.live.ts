import { Effect, Layer } from "effect";

import { MenuItemCatalogFacade } from "../../../menu/public";
import { OrderPricingGateway } from "../../application/ports/outbound/order-pricing.gateway";

export const OrderPricingGatewayLive = Layer.effect(
  OrderPricingGateway,
  Effect.gen(function* () {
    const menuItemCatalogFacade = yield* MenuItemCatalogFacade;

    return OrderPricingGateway.of({
      findPrices: (menuItemIds) => menuItemCatalogFacade.findPrices(menuItemIds),
    });
  }),
);
