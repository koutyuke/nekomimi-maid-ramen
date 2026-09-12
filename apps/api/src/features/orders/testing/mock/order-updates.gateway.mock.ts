import { Effect, Layer } from "effect";

import { OrderUpdatesGateway } from "../../application/ports/outbound/order-updates.gateway";

export const orderUpdatesGatewayMock = Layer.succeed(OrderUpdatesGateway, { notify: () => Effect.void });
