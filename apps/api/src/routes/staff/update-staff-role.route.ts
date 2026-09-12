import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { updateStaffRole, EditableStaffRole, Staff } from "../../features/staff/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type UpdateStaffRoleRouteRequirements =
  | Effect.Effect.Context<ReturnType<typeof updateStaffRole>>
  | StaffAccessPluginRequirements;

export const updateStaffRoleRoute = (run: EffectRunner<UpdateStaffRoleRouteRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .patch(
      "/staff/:id/role",
      async ({ staff, params, body, set, status }) => {
        set.headers["cache-control"] = "no-store";
        return run(
          logAndDie(
            updateStaffRole(staff, params.id, body.role).pipe(
              Effect.map((member) => ({ staff: member })),
              Effect.catchTag("StaffForbidden", () => Effect.succeed(status(403, { code: "forbidden" } as const))),
              Effect.catchTag("StaffNotFound", () => Effect.succeed(status(404, { code: "staff_not_found" } as const))),
            ),
          ),
        );
      },
      {
        staffRole: "Admin",
        detail: {
          operationId: "updateStaffRole",
          summary: "利用者のロールを変更",
          description:
            "OwnerはAdmin・Staff・Noneへの変更が可能。AdminはNoneとStaffの間だけ変更できる。Ownerと自分自身は変更不可。変更は対象者の次の操作から適用される。",
          tags: ["ロール管理"],
        },
        params: Schema.standardSchemaV1(
          Schema.Struct({ id: Schema.String.annotations({ description: "変更対象の利用者ID" }) }),
        ),
        body: Schema.standardSchemaV1(
          Schema.Struct({
            role: EditableStaffRole.annotations({
              description: "変更後のロール。Noneは業務権限を剥奪する。Adminの付与・剥奪はOwnerのみ。",
            }),
          }),
        ),
        response: {
          200: Schema.standardSchemaV1(Schema.Struct({ staff: Staff })),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          404: Schema.standardSchemaV1(Schema.Struct({ code: Schema.Literal("staff_not_found") })),
        },
      },
    );
