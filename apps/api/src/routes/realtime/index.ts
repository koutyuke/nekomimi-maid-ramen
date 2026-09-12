import { Elysia } from "elysia";

import { upgradeWebSocketRoute } from "./upgrade-websocket.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { UpgradeWebSocket, UpgradeWebSocketRequirements } from "./upgrade-websocket.route";

export type { UpgradeWebSocket } from "./upgrade-websocket.route";

export type RealtimeRoutesRequirements = UpgradeWebSocketRequirements;

export const realtimeRoutes = (
  run: EffectRunner<RealtimeRoutesRequirements>,
  origin: string,
  upgradeWebSocket: UpgradeWebSocket,
) =>
  new Elysia()
    // Routes
    .use(upgradeWebSocketRoute(run, origin, upgradeWebSocket));
