import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { makeDatabaseLive } from "../core/infra/drizzle";
import { connectWebSocketHub } from "../core/infra/websocket";
import { MenuLayer } from "../features/menu/layer";
import { makeOrdersLayer } from "../features/orders/layer";
import { makeRealtimeLayer } from "../features/realtime/layer";
import { makeStaffLayer } from "../features/staff/layer";
import { getAPIBaseURL, getStaffBaseURL } from "@nekomimi/core/http";

const production = env.ENVIRONMENT !== "development";
const webBaseURL = getStaffBaseURL(production);
const apiBaseURL = getAPIBaseURL(production);
export const origin = webBaseURL.origin;
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

export const runtime = ManagedRuntime.make(AppLayer);

export const upgradeWebSocket = (sessionId: string) => connectWebSocketHub(env.STAFF_UPDATES, sessionId);
