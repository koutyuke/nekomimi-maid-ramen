import { Elysia } from "elysia";

import { adjustStockRoute } from "./adjust-stock.route";
import { changeMenuPriceRoute } from "./change-menu-price.route";
import { menuRevisionRoute } from "./menu-revision.route";
import { staffMenuRoute } from "./staff-menu.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { AdjustStockRequirements } from "./adjust-stock.route";
import type { ChangeMenuPriceRequirements } from "./change-menu-price.route";
import type { MenuRevisionRequirements } from "./menu-revision.route";
import type { StaffMenuRequirements } from "./staff-menu.route";

export type MenuRoutesRequirements =
  | StaffMenuRequirements
  | MenuRevisionRequirements
  | AdjustStockRequirements
  | ChangeMenuPriceRequirements;

export const menuRoutes = (run: EffectRunner<MenuRoutesRequirements>, origin: string) =>
  new Elysia()
    // Routes
    .use(adjustStockRoute(run, origin))
    .use(changeMenuPriceRoute(run, origin))
    .use(menuRevisionRoute(run, origin))
    .use(staffMenuRoute(run, origin));
