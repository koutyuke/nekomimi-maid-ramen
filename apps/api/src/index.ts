import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { makeDatabaseLive } from "./core/infra/drizzle";
import { MenuLayer } from "./features/menu/layer";
import { makeOrdersLayer } from "./features/orders/layer";
import { makeStaffLayer } from "./features/staff/layer";
import { getAPIBaseURL, getStaffBaseURL } from "@nekomimi/core/http";

const production = env.ENVIRONMENT !== "development";
const webBaseURL = getStaffBaseURL(production);
const apiBaseURL = getAPIBaseURL(production);
const origin = webBaseURL.origin;
const googleCallbackPath = "/auth/google/callback";
const authenticationResultPath = "/";

const OrdersLayer = makeOrdersLayer(env.OWNER_EMAIL ?? "").pipe(Layer.provide(MenuLayer));
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

export default createApp({
  origin,
  runtime: ManagedRuntime.make(AppLayer),
});
