import { Elysia } from "elysia";

import { adjustStockRoute } from "./adjust-stock.route";
import { menuRevisionRoute } from "./menu-revision.route";
import { menuRoute } from "./menu.route";
import { staffMenuRoute } from "./staff-menu.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { AdjustStockRequirements } from "./adjust-stock.route";
import type { MenuRevisionRequirements } from "./menu-revision.route";
import type { MenuRouteRequirements } from "./menu.route";
import type { StaffMenuRequirements } from "./staff-menu.route";

export type MenuRoutesRequirements =
  | MenuRouteRequirements
  | StaffMenuRequirements
  | MenuRevisionRequirements
  | AdjustStockRequirements;

export const menuRoutes = (run: EffectRunner<MenuRoutesRequirements>, origin: string) =>
  new Elysia()
    // Routes
    .use(adjustStockRoute(run, origin))
    .use(menuRevisionRoute(run, origin))
    .use(staffMenuRoute(run, origin))
    .use(menuRoute(run));
