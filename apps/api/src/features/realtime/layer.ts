import { Layer } from "effect";

import { UpdateNotifierFacadeLive } from "./application/facades/update-notifier.facade.live";
import { makeUpdatePublisherGatewayLive } from "./infra/update-publisher.gateway.live";
import type { WebSocketHub } from "../../core/infra/websocket";

export const makeRealtimeLayer = (namespace: DurableObjectNamespace<WebSocketHub>) =>
  Layer.mergeAll(UpdateNotifierFacadeLive.pipe(Layer.provide(makeUpdatePublisherGatewayLive(namespace))));
