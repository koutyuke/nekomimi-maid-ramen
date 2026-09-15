import { Layer } from "effect";

import { OrderPricingGatewayLive } from "./adapters/menu/order-pricing.gateway.live";
import { OrderStockAvailabilityGatewayLive } from "./adapters/menu/order-stock-availability.gateway.live";
import { OrderUpdatesGatewayLive } from "./adapters/realtime/order-updates.gateway.live";
import { CancelOrderCommandLive } from "./infra/commands/cancel-order.command.live";
import { CompleteHandoffCommandLive } from "./infra/commands/complete-handoff.command.live";
import { OrderConfirmationCommandLive } from "./infra/commands/order-confirmation.command.live";
import { UpdateCookingStateCommandLive } from "./infra/commands/update-cooking-state.command.live";
import { OrderRepositoryLive } from "./infra/repositories/order.repository.live";

export const OrdersLayer = Layer.mergeAll(
  OrderUpdatesGatewayLive,
  CancelOrderCommandLive,
  OrderConfirmationCommandLive,
  OrderRepositoryLive,
  OrderPricingGatewayLive,
  OrderStockAvailabilityGatewayLive,
  UpdateCookingStateCommandLive,
  CompleteHandoffCommandLive,
);
