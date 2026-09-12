import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { listStaff, Staff } from "../../features/staff/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type ListStaffRouteRequirements =
  | Effect.Effect.Context<ReturnType<typeof listStaff>>
  | StaffAccessPluginRequirements;

export const listStaffRoute = (run: EffectRunner<ListStaffRouteRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff",
      async ({ staff, set, status }) => {
        set.headers["cache-control"] = "no-store";
        return run(
          logAndDie(
            listStaff(staff).pipe(
              Effect.map((members) => ({ staff: members })),
              Effect.catchTag("StaffForbidden", () => Effect.succeed(status(403, { code: "forbidden" } as const))),
            ),
          ),
        );
      },
      {
        staffRole: "Admin",
        detail: {
          operationId: "listStaff",
          summary: "利用者とロールの一覧を取得",
          description:
            "OwnerとAdminが、Googleログインの登録を完了した利用者を名前順・ID順に取得する。Noneは業務権限なしを表す。",
          tags: ["ロール管理"],
        },
        response: {
          200: Schema.standardSchemaV1(Schema.Struct({ staff: Schema.Array(Staff) })),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
