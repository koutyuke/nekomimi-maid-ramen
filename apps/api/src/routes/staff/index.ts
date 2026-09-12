import { Elysia } from "elysia";

import { listStaffRoute } from "./list-staff.route";
import { updateStaffRoleRoute } from "./update-staff-role.route";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { ListStaffRouteRequirements } from "./list-staff.route";
import type { UpdateStaffRoleRouteRequirements } from "./update-staff-role.route";

export type StaffRoutesRequirements = ListStaffRouteRequirements | UpdateStaffRoleRouteRequirements;

export const staffRoutes = (run: EffectRunner<StaffRoutesRequirements>, origin: string) =>
  new Elysia()
    // Routes
    .use(listStaffRoute(run, origin))
    .use(updateStaffRoleRoute(run, origin));
