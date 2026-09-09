import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { makeDatabaseLive } from "./core/infra/drizzle";
import { InventoryLayer } from "./features/inventory/layer";
import { SalesLayer } from "./features/sales/layer";
import { makeSystemWideLayer } from "./features/system-wide/layer";
import { VisitorInformationLayer } from "./features/visitor-information/layer";
import { getAPIBaseURL, getWebBaseURL } from "@nekomimi/core/http";

const production = env.ENVIRONMENT !== "development";
const webBaseURL = getWebBaseURL(production);
const apiBaseURL = getAPIBaseURL(production);
const origin = webBaseURL.origin;
const googleCallbackPath = "/auth/google/callback";
const authenticationResultPath = "/staff";

const VisitorWithInventoryLayer = VisitorInformationLayer.pipe(Layer.provide(InventoryLayer));
const InventoryAndVisitorLayer = Layer.mergeAll(InventoryLayer, VisitorWithInventoryLayer);
const SalesWithInventoryLayer = SalesLayer.pipe(Layer.provide(InventoryAndVisitorLayer));
const AppLayer = Layer.mergeAll(
  InventoryAndVisitorLayer,
  SalesWithInventoryLayer,
  makeSystemWideLayer(env.DB, {
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
