import { Effect, Layer } from "effect";

import { UpdateNotifierFacade } from "../../../realtime/public";
import { MenuUpdatesGateway } from "../../application/ports/outbound/menu-updates.gateway";

export const MenuUpdatesGatewayLive = Layer.effect(
  MenuUpdatesGateway,
  Effect.gen(function* () {
    const notifier = yield* UpdateNotifierFacade;
    return MenuUpdatesGateway.of({ notify: () => notifier.notify(["menu"]) });
  }),
);
