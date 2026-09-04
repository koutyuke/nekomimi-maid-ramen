import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { databaseLayer } from "./core/infra/drizzle/database";
import { inventoryLayer } from "./features/inventory/layer";
import { visitorInformationLayer } from "./features/visitor-information/layer";

const appLayer = Layer.mergeAll(inventoryLayer, visitorInformationLayer).pipe(Layer.provide(databaseLayer(env.DB)));

export default createApp({
  origin: env.WEB_ORIGIN,
  runtime: ManagedRuntime.make(appLayer),
});
