import { Layer } from "effect";

import { OrderConfirmationCommandLive } from "./adapters/commands/order-confirmation.command.live";
import { OrderStockAvailabilityLive } from "./adapters/inventory/order-stock-availability.live";
import { OrderRepositoryLive } from "./adapters/repositories/order.repository.live";
import { OrderPricingLive } from "./adapters/visitor-information/order-pricing.live";

export const SalesLayer = Layer.mergeAll(
  OrderConfirmationCommandLive,
  OrderRepositoryLive,
  OrderPricingLive,
  OrderStockAvailabilityLive,
);
