import { Effect, Layer } from "effect";

import { MenuUpdatesGateway } from "../../application/ports/outbound/menu-updates.gateway";

export const menuUpdatesGatewayMock = Layer.succeed(MenuUpdatesGateway, { notify: () => Effect.void });
