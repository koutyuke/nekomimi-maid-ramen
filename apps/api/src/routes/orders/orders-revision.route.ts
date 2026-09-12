import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { Revision } from "../../core/domain/revision";
import { getOrdersRevision } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type OrdersRevisionRequirements =
  | Effect.Effect.Context<ReturnType<typeof getOrdersRevision>>
  | StaffAccessPluginRequirements;

export const ordersRevisionRoute = (run: EffectRunner<OrdersRevisionRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff/orders/revision",
      ({ set }) => {
        set.headers["cache-control"] = "no-store";
        return run(logAndDie(getOrdersRevision().pipe(Effect.map((revision) => ({ revision })))));
      },
      {
        staffRole: "Staff",
        detail: { operationId: "getOrdersRevision", summary: "注文のリビジョンを取得", tags: ["注文"] },
        response: {
          200: Schema.standardSchemaV1(Schema.Struct({ revision: Revision })),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
