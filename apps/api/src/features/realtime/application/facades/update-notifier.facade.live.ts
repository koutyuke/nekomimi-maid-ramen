import { Effect, Layer } from "effect";

import { UpdateNotifierFacade } from "../ports/inbound/update-notifier.facade";
import { UpdatePublisherGateway } from "../ports/outbound/update-publisher.gateway";
import { notifyUpdates } from "../use-cases/notify-updates";

export const UpdateNotifierFacadeLive = Layer.effect(
  UpdateNotifierFacade,
  Effect.gen(function* () {
    const publisher = yield* UpdatePublisherGateway;
    return UpdateNotifierFacade.of({
      notify: (scopes) => notifyUpdates(scopes).pipe(Effect.provideService(UpdatePublisherGateway, publisher)),
    });
  }),
);
