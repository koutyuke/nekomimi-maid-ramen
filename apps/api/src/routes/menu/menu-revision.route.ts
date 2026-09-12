import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { Revision } from "../../core/domain/revision";
import { getMenuRevision } from "../../features/menu/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type MenuRevisionRequirements =
  | Effect.Effect.Context<ReturnType<typeof getMenuRevision>>
  | StaffAccessPluginRequirements;

export const menuRevisionRoute = (run: EffectRunner<MenuRevisionRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff/menu/revision",
      ({ set }) => {
        set.headers["cache-control"] = "no-store";
        return run(logAndDie(getMenuRevision().pipe(Effect.map((revision) => ({ revision })))));
      },
      {
        staffRole: "Staff",
        detail: { operationId: "getMenuRevision", summary: "メニューのリビジョンを取得", tags: ["メニュー"] },
        response: {
          200: Schema.standardSchemaV1(Schema.Struct({ revision: Revision })),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
