import { Elysia } from "elysia";

import { menuRevisionRoute } from "./menu-revision.route";
import { menuRoute } from "./menu.route";
import { staffMenuRoute } from "./staff-menu.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { MenuRevisionRequirements } from "./menu-revision.route";
import type { MenuRouteRequirements } from "./menu.route";
import type { StaffMenuRequirements } from "./staff-menu.route";

export type MenuRoutesRequirements = MenuRouteRequirements | StaffMenuRequirements | MenuRevisionRequirements;

export const menuRoutes = (run: EffectRunner<MenuRoutesRequirements>, origin: string) =>
  new Elysia()
    // Routes
    .use(menuRevisionRoute(run, origin))
    .use(staffMenuRoute(run, origin))
    .use(menuRoute(run));
