import { Layer } from "effect";

import { OrderPricingGatewayLive } from "./adapters/menu/order-pricing.gateway.live";
import { OrderStockAvailabilityGatewayLive } from "./adapters/menu/order-stock-availability.gateway.live";
import { OrderUpdatesGatewayLive } from "./adapters/realtime/order-updates.gateway.live";
import { makeCancelOrderCommandLive } from "./infra/commands/cancel-order.command.live";
import { makeCompleteHandoffCommandLive } from "./infra/commands/complete-handoff.command.live";
import { OrderConfirmationCommandLive } from "./infra/commands/order-confirmation.command.live";
import { makeUpdateCookingStateCommandLive } from "./infra/commands/update-cooking-state.command.live";
import { OrderRepositoryLive } from "./infra/repositories/order.repository.live";

export const makeOrdersLayer = (ownerEmail: string) =>
  Layer.mergeAll(
    OrderUpdatesGatewayLive,
    makeCancelOrderCommandLive(ownerEmail),
    OrderConfirmationCommandLive,
    OrderRepositoryLive,
    OrderPricingGatewayLive,
    OrderStockAvailabilityGatewayLive,
    makeUpdateCookingStateCommandLive(ownerEmail),
    makeCompleteHandoffCommandLive(ownerEmail),
  );
