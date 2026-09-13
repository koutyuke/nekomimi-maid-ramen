import { Effect, Layer } from "effect";

import { CancelOrderCommand } from "../../application/ports/outbound/cancel-order.command";
import { CompleteHandoffCommand } from "../../application/ports/outbound/complete-handoff.command";
import { UpdateCookingStateCommand } from "../../application/ports/outbound/update-cooking-state.command";
import { orderUpdatesGatewayMock } from "./order-updates.gateway.mock";

export const orderOperationsMock = () =>
  Layer.mergeAll(
    orderUpdatesGatewayMock,
    Layer.succeed(CancelOrderCommand, { execute: () => Effect.die("Unexpected order cancellation") }),
    Layer.succeed(UpdateCookingStateCommand, { execute: () => Effect.die("Unexpected cooking state update") }),
    Layer.succeed(CompleteHandoffCommand, { execute: () => Effect.die("Unexpected handoff completion") }),
  );
