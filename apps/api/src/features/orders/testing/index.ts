import { Effect, Layer } from "effect";

import { CompleteHandoffCommand } from "../application/ports/outbound/complete-handoff.command";
import { UpdateCookingStateCommand } from "../application/ports/outbound/update-cooking-state.command";

export { orderFixture, orderLineFixture } from "./fixtures/order.fixture";
export { failingOrderRepositoryMock, orderRepositoryMock } from "./mocks/order.repository.mock";
export { orderPricingGatewayMock } from "./mocks/order-pricing.gateway.mock";
export {
  orderStockAvailabilityGatewayMock,
  orderStockAvailabilityGatewaySequenceMock,
} from "./mocks/order-stock-availability.gateway.mock";
export type { ConfirmOutcome, OrderRepositoryMockOptions } from "./mocks/order.repository.mock";

export const orderOperationsMock = () =>
  Layer.mergeAll(
    Layer.succeed(UpdateCookingStateCommand, { execute: () => Effect.die("Unexpected cooking state update") }),
    Layer.succeed(CompleteHandoffCommand, { execute: () => Effect.die("Unexpected handoff completion") }),
  );
