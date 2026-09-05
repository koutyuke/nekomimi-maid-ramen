import { Layer } from "effect";

import { OrderRepositoryLive } from "./adapters/repositories/order.repository.live";

export const SalesLayer = Layer.mergeAll(OrderRepositoryLive);
