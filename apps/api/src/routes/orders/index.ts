import { Elysia } from "elysia";

import { cancelOrderRoute } from "./cancel-order.route";
import { completeHandoffRoute } from "./complete-handoff.route";
import { confirmOrderRoute } from "./confirm-orders.route";
import { listOrdersRoute } from "./list-orders.route";
import { ordersRevisionRoute } from "./orders-revision.route";
import { updateCookingStateRoute } from "./update-cooking-state.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { CancelOrderRequirements } from "./cancel-order.route";
import type { CompleteHandoffRequirements } from "./complete-handoff.route";
import type { OrderRouteRequirements } from "./confirm-orders.route";
import type { ListOrdersRequirements } from "./list-orders.route";
import type { OrdersRevisionRequirements } from "./orders-revision.route";
import type { UpdateCookingStateRequirements } from "./update-cooking-state.route";

export type OrdersRoutesRequirements =
  | CancelOrderRequirements
  | OrdersRevisionRequirements
  | ListOrdersRequirements
  | UpdateCookingStateRequirements
  | CompleteHandoffRequirements
  | OrderRouteRequirements;

export const ordersRoutes = (run: EffectRunner<OrdersRoutesRequirements>, origin: string) =>
  new Elysia()
    // Routes
    .use(ordersRevisionRoute(run, origin))
    .use(listOrdersRoute(run, origin))
    .use(updateCookingStateRoute(run, origin))
    .use(completeHandoffRoute(run, origin))
    .use(cancelOrderRoute(run, origin))
    .use(confirmOrderRoute(run, origin));
