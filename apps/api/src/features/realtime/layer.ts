import { Layer } from "effect";

import { UpdateNotifierFacadeLive } from "./application/facades/update-notifier.facade.live";
import { makeUpdatePublisherGatewayLive } from "./infra/update-publisher.gateway.live";
import type { RealtimeHub } from "../../core/infra/realtime";

export const makeRealtimeLayer = (namespace: DurableObjectNamespace<RealtimeHub>) =>
  Layer.mergeAll(UpdateNotifierFacadeLive.pipe(Layer.provide(makeUpdatePublisherGatewayLive(namespace))));
