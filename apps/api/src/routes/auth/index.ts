import { Elysia } from "elysia";

import { googleCallbackRoute } from "./google-callback.route";
import { googleRoute } from "./google.route";
import { logoutRoute } from "./logout.route";
import { sessionRoute } from "./session.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { GoogleCallbackRouteRequirements } from "./google-callback.route";
import type { GoogleRouteRequirements } from "./google.route";
import type { LogoutRouteRequirements } from "./logout.route";
import type { SessionRouteRequirements } from "./session.route";

/* eslint-disable typescript/no-duplicate-type-constituents -- 各ルートの依存変更を集約型へ反映するため、現在同じ型でも列挙する。 */
export type AuthRoutesRequirements =
  | SessionRouteRequirements
  | GoogleRouteRequirements
  | GoogleCallbackRouteRequirements
  | LogoutRouteRequirements;
/* eslint-enable typescript/no-duplicate-type-constituents */

export const authRoutes = (run: EffectRunner<AuthRoutesRequirements>) =>
  new Elysia()
    // Routes
    .use(sessionRoute(run))
    .use(googleRoute(run))
    .use(googleCallbackRoute(run))
    .use(logoutRoute(run));
