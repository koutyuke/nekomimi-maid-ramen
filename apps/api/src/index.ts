import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { makeRunner } from "./core/adapters/elysia";
import { makeDatabaseLive } from "./core/infra/drizzle";
import { RealtimeHub, connectRealtime } from "./core/infra/realtime";
import { MenuLayer } from "./features/menu/layer";
import { makeOrdersLayer } from "./features/orders/layer";
import { makeRealtimeLayer } from "./features/realtime/layer";
import { makeStaffLayer } from "./features/staff/layer";
import { canReceiveUpdates } from "./features/staff/public";
import { connectStaffUpdates } from "./routes/realtime/connect-updates.route";
import { getAPIBaseURL, getStaffBaseURL } from "@nekomimi/core/http";

const production = env.ENVIRONMENT !== "development";
const webBaseURL = getStaffBaseURL(production);
const apiBaseURL = getAPIBaseURL(production);
const origin = webBaseURL.origin;
const googleCallbackPath = "/auth/google/callback";
const authenticationResultPath = "/";

const RealtimeLayer = makeRealtimeLayer(env.STAFF_UPDATES);
const OrdersLayer = makeOrdersLayer(env.OWNER_EMAIL ?? "").pipe(
  Layer.provide(Layer.mergeAll(MenuLayer, RealtimeLayer)),
);
const AppLayer = Layer.mergeAll(
  MenuLayer,
  OrdersLayer,
  makeStaffLayer(env.DB, {
    apiBaseURL,
    webBaseURL,
    googleClientId: env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    googleCallbackPath,
    authenticationResultPath,
    schoolDomain: env.SCHOOL_DOMAIN,
    secret: env.BETTER_AUTH_SECRET ?? "",
    ownerEmail: env.OWNER_EMAIL ?? "",
  }),
).pipe(Layer.provide(makeDatabaseLive(env.DB)));

const runtime = ManagedRuntime.make(AppLayer);

export class StaffUpdates extends RealtimeHub {
  constructor(ctx: DurableObjectState, bindings: Env) {
    super(ctx, bindings, (sessionId) => runtime.runPromise(canReceiveUpdates(sessionId)));
  }
}

const app = createApp({ origin, runtime });
const run = makeRunner(runtime);

export default {
  fetch: (request: Request) =>
    new URL(request.url).pathname === "/staff/sync/events"
      ? connectStaffUpdates(run, origin, request, (sessionId) => connectRealtime(env.STAFF_UPDATES, sessionId))
      : app.fetch(request),
} satisfies ExportedHandler<Env>;
