import { Option, Schema } from "effect";
import { Elysia } from "elysia";
import type { Effect } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { getCurrentStaff } from "../../features/staff/public";
import { SessionResponse } from "./auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";

export type SessionRouteRequirements = Effect.Effect.Context<ReturnType<typeof getCurrentStaff>>;

export const sessionRoute = (run: EffectRunner<SessionRouteRequirements>) =>
  new Elysia()
    // Endpoints
    .get(
      "/auth/session",
      async ({ request, set }) => {
        const responseHeaders = new Headers();
        const staff = await run(logAndDie(getCurrentStaff(request.headers, responseHeaders)));
        const setCookies = responseHeaders.getSetCookie();

        set.headers["cache-control"] = "no-store";
        if (setCookies.length > 0) {
          set.headers["set-cookie"] = setCookies;
        }
        return {
          staff: Option.getOrNull(staff),
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
