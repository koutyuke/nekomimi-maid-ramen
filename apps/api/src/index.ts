import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { databaseLayer } from "./core/infra/drizzle/database";
import { InventoryLayer } from "./features/inventory/layer";
import { SalesLayer } from "./features/sales/layer";
import { VisitorInformationLayer } from "./features/visitor-information/layer";
import { OrderConfirmationCommitLive } from "./integrations/order-confirmation/order-confirmation.commit.live";

const VisitorWithInventoryLayer = VisitorInformationLayer.pipe(Layer.provide(InventoryLayer));
const InventoryAndVisitorLayer = Layer.mergeAll(InventoryLayer, VisitorWithInventoryLayer);
const SalesAndIntegrationLayer = Layer.mergeAll(SalesLayer, OrderConfirmationCommitLive).pipe(
  Layer.provide(InventoryAndVisitorLayer),
);
const AppLayer = Layer.mergeAll(InventoryAndVisitorLayer, SalesAndIntegrationLayer).pipe(
  Layer.provide(databaseLayer(env.DB)),
);

export default createApp({
  origin: env.ORIGIN,
  runtime: ManagedRuntime.make(AppLayer),
});
