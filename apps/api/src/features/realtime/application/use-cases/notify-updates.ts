import { Effect } from "effect";

import { UpdatePublisherGateway } from "../ports/outbound/update-publisher.gateway";
import type { ResourceScope } from "../../../../core/domain/revision";

export const notifyUpdates = (scopes: readonly ResourceScope[]) =>
  Effect.gen(function* () {
    const publisher = yield* UpdatePublisherGateway;
    // 通知の失敗では保存済みの業務結果を失敗へ変えない。漏れはリビジョン照合で回収する。
    yield* publisher.publish(scopes).pipe(
      Effect.timeout("1 second"),
      Effect.catchAllCause(() =>
        Effect.logError("変更通知に失敗しました").pipe(Effect.annotateLogs({ operation: "realtime.publish", scopes })),
      ),
    );
  });
