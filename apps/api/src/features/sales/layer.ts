import { Layer } from "effect";

import { OrderStockAvailabilityGatewayLive } from "./adapters/inventory/order-stock-availability.gateway.live";
import { OrderPricingGatewayLive } from "./adapters/visitor-information/order-pricing.gateway.live";
import { OrderConfirmationCommandLive } from "./infra/commands/order-confirmation.command.live";
import { OrderRepositoryLive } from "./infra/repositories/order.repository.live";

export const SalesLayer = Layer.mergeAll(
  OrderConfirmationCommandLive,
  OrderRepositoryLive,
  OrderPricingGatewayLive,
  OrderStockAvailabilityGatewayLive,
);
