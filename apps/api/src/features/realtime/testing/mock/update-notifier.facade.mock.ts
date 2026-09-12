import { Effect, Layer } from "effect";

import { UpdateNotifierFacadeLive } from "../../application/facades/update-notifier.facade.live";
import { UpdateNotifierFacade } from "../../application/ports/inbound/update-notifier.facade";
import { UpdatePublisherGateway } from "../../application/ports/outbound/update-publisher.gateway";
import type { PersistenceError } from "../../../../core/domain/persistence-error";

export const updateNotifierMock = Layer.succeed(UpdateNotifierFacade, { notify: () => Effect.void });
export const failingUpdateNotifierMock = (failure: Effect.Effect<void, PersistenceError>) =>
  UpdateNotifierFacadeLive.pipe(Layer.provide(Layer.succeed(UpdatePublisherGateway, { publish: () => failure })));
