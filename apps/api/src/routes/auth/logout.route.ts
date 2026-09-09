import { Elysia } from "elysia";
import type { Effect } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { logout } from "../../features/system-wide/public";
import type { EffectRunner } from "../../core/adapters/elysia";

export type LogoutRouteRequirements = Effect.Effect.Context<ReturnType<typeof logout>>;

export const logoutRoute = (run: EffectRunner<LogoutRouteRequirements>) =>
  new Elysia().post("/auth/logout", ({ request }) => run(logAndDie(logout(request))), {
    detail: {
      operationId: "logout",
      summary: "ログアウト",
      description: "現在のセッションを無効にし、セッションCookieを削除する。",
      tags: ["認証"],
      responses: {
        200: { description: "ログアウトが完了した" },
        403: { description: "許可していない送信元から要求された" },
        503: { description: "認証サービスを利用できない" },
      },
    },
  });
