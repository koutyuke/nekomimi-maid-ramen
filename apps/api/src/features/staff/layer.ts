import { Effect, Layer, Option } from "effect";

import { AuthenticationGateway } from "./application/ports/outbound/authentication.gateway";
import { makeAuthenticationGateway } from "./infra/authentication.gateway.live";
import { makeStaffRepositoryLive } from "./infra/staff.repository.live";
import type { AuthenticationConfig } from "./infra/authentication.gateway.live";

export const makeStaffLayer = (d1: D1Database, config: AuthenticationConfig) =>
  Layer.merge(
    makeStaffRepositoryLive(config.ownerEmail),
    Layer.sync(AuthenticationGateway, () => {
      // 未設定でも公開ページは動かし、認証と業務操作は閉じる。
      if (!config.googleClientId || !config.googleClientSecret || !config.secret || !config.ownerEmail) {
        return AuthenticationGateway.of({
          request: () => Effect.succeed(Response.json({ code: "authentication_unavailable" }, { status: 503 })),
          callback: () => Effect.succeed(Response.json({ code: "authentication_unavailable" }, { status: 503 })),
          logout: () => Effect.succeed(Response.json({ code: "authentication_unavailable" }, { status: 503 })),
          getSession: () => Effect.succeed(Option.none()),
        });
      }
      return makeAuthenticationGateway(d1, config);
    }),
  );
