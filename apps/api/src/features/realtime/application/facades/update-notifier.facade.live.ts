import { Effect, Layer } from "effect";

import { UpdateNotifierFacade } from "../ports/inbound/update-notifier.facade";
import { UpdatePublisherGateway } from "../ports/outbound/update-publisher.gateway";

export const UpdateNotifierFacadeLive = Layer.effect(
  UpdateNotifierFacade,
  Effect.gen(function* () {
    const publisher = yield* UpdatePublisherGateway;
    return UpdateNotifierFacade.of({
      notify: (scopes) =>
        Effect.gen(function* () {
          // 通知の失敗では保存済みの業務結果を失敗へ変えない。漏れはリビジョン照合で回収する。
          yield* publisher.publish(scopes).pipe(
            Effect.timeout("1 second"),
            Effect.catchAllCause(() =>
              Effect.logError("変更通知に失敗しました").pipe(
                Effect.annotateLogs({
                  operation: "realtime.publish",
                  scopes,
                }),
              ),
            ),
          );
        }),
    });
  }),
);
