import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { requestAuthentication } from "../../features/system-wide/public";
import { AuthenticationUnavailableResponse, ForbiddenResponse, GoogleSignInResponse } from "./auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";

export type GoogleRouteRequirements = Effect.Effect.Context<ReturnType<typeof requestAuthentication>>;

export const googleRoute = (run: EffectRunner<GoogleRouteRequirements>) =>
  new Elysia()
    // Endpoints
    .post(
      "/auth/google",
      async ({ request, set, status }) => {
        const response = await run(logAndDie(requestAuthentication(request)));

        if (response.status === 403) {
          return status(403, { code: "forbidden" } as const);
        }

        if (!response.ok) {
          return status(503, { code: "authentication_unavailable" } as const);
        }

        set.headers["set-cookie"] = response.headers.getSetCookie();
        set.headers["cache-control"] = "no-store";

        return run(
          logAndDie(
            Effect.tryPromise(() => response.json()).pipe(Effect.flatMap(Schema.decodeUnknown(GoogleSignInResponse))),
          ),
        );
      },
      {
        detail: {
          operationId: "startGoogleAuthentication",
          summary: "Google認証を開始",
          description: "学校アカウントで認証するためのGoogle認証画面URLを発行する。",
          tags: ["認証"],
        },
        response: {
          200: Schema.standardSchemaV1(GoogleSignInResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          503: Schema.standardSchemaV1(AuthenticationUnavailableResponse),
        },
      },
    );
