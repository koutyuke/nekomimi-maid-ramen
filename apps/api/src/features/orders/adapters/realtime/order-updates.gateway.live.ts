import { Effect, Layer } from "effect";

import { UpdateNotifierFacade } from "../../../realtime/public";
import { OrderUpdatesGateway } from "../../application/ports/outbound/order-updates.gateway";

export const OrderUpdatesGatewayLive = Layer.effect(
  OrderUpdatesGateway,
  Effect.gen(function* () {
    const notifier = yield* UpdateNotifierFacade;
    return OrderUpdatesGateway.of({ notify: (scopes) => notifier.notify(scopes) });
  }),
);
