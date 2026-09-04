import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { databaseLayer } from "./core/infra/drizzle/database";
import { InventoryLayer } from "./features/inventory/layer";
import { VisitorInformationLayer } from "./features/visitor-information/layer";

const AppLayer = Layer.mergeAll(InventoryLayer, VisitorInformationLayer).pipe(Layer.provide(databaseLayer(env.DB)));

export default createApp({
  origin: env.ORIGIN,
  runtime: ManagedRuntime.make(AppLayer),
});
