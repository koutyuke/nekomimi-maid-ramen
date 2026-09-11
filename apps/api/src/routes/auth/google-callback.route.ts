import { Elysia } from "elysia";
import type { Effect } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { callbackAuthentication } from "../../features/staff/public";
import type { EffectRunner } from "../../core/adapters/elysia";

export type GoogleCallbackRouteRequirements = Effect.Effect.Context<ReturnType<typeof callbackAuthentication>>;

export const googleCallbackRoute = (run: EffectRunner<GoogleCallbackRouteRequirements>) =>
  new Elysia()
    // Endpoints
    .get("/auth/google/callback", ({ request }) => run(logAndDie(callbackAuthentication(request))), {
      detail: {
        operationId: "completeGoogleAuthentication",
        summary: "Google認証を完了",
        description: "Googleから認可結果を受け取り、セッションを作成して担当者画面へ移動する。",
        tags: ["認証"],
        responses: {
          302: { description: "認証結果を付けて担当者画面へ移動する" },
          503: { description: "認証サービスを利用できない" },
        },
      },
    });
