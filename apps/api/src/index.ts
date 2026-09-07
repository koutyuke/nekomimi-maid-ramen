import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { makeDatabaseExecutorLive } from "./core/infra/drizzle/database.executor";
import { InventoryLayer } from "./features/inventory/layer";
import { SalesLayer } from "./features/sales/layer";
import { VisitorInformationLayer } from "./features/visitor-information/layer";

const VisitorWithInventoryLayer = VisitorInformationLayer.pipe(Layer.provide(InventoryLayer));
const InventoryAndVisitorLayer = Layer.mergeAll(InventoryLayer, VisitorWithInventoryLayer);
const SalesWithInventoryLayer = SalesLayer.pipe(Layer.provide(InventoryAndVisitorLayer));
const AppLayer = Layer.mergeAll(InventoryAndVisitorLayer, SalesWithInventoryLayer).pipe(
  Layer.provide(makeDatabaseExecutorLive(env.DB)),
);

export default createApp({
  origin: env.ORIGIN,
  runtime: ManagedRuntime.make(AppLayer),
});
