import { Option, Schema } from "effect";
import { Elysia } from "elysia";
import type { Effect } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { getCurrentStaff } from "../../features/system-wide/public";
import { SessionResponse } from "./auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";

export type SessionRouteRequirements = Effect.Effect.Context<ReturnType<typeof getCurrentStaff>>;

export const sessionRoute = (run: EffectRunner<SessionRouteRequirements>) =>
  new Elysia().get(
    "/auth/session",
    async ({ request, set }) => {
      set.headers["cache-control"] = "no-store";
      return {
        staff: Option.getOrNull(await run(logAndDie(getCurrentStaff(request.headers)))),
      };
    },
    {
      detail: {
        operationId: "getAuthenticationSession",
        summary: "認証状態を取得",
        description: "セッションCookieを確認し、現在の担当者とロールを返す。未認証の場合はstaffをnullで返す。",
        tags: ["認証"],
      },
      response: Schema.standardSchemaV1(SessionResponse),
    },
  );
