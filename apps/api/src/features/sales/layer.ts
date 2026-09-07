import { Layer } from "effect";

import { OrderStockAvailabilityLive } from "./adapters/inventory/order-stock-availability.live";
import { OrderPricingLive } from "./adapters/visitor-information/order-pricing.live";
import { OrderConfirmationCommandLive } from "./infra/commands/order-confirmation.command.live";
import { OrderRepositoryLive } from "./infra/repositories/order.repository.live";

export const SalesLayer = Layer.mergeAll(
  OrderConfirmationCommandLive,
  OrderRepositoryLive,
  OrderPricingLive,
  OrderStockAvailabilityLive,
);
