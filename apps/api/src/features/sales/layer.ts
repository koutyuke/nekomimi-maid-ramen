import { Layer } from "effect";

import { OrderStockAvailabilityLive } from "./adapters/inventory/order-stock-availability.live";
import { OrderRepositoryLive } from "./adapters/repositories/order.repository.live";
import { OrderPricingLive } from "./adapters/visitor-information/order-pricing.live";

export const SalesLayer = Layer.mergeAll(OrderRepositoryLive, OrderPricingLive, OrderStockAvailabilityLive);
