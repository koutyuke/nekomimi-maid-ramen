import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { CookingState } from "../../core/domain/cooking-state";
import { updateCookingState } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { CookingStateResponse, KitchenConflictResponse } from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type UpdateCookingStateRequirements =
  | Effect.Effect.Context<ReturnType<typeof updateCookingState>>
  | StaffAccessPluginRequirements;

export const updateCookingStateRoute = (run: EffectRunner<UpdateCookingStateRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .patch(
      "/staff/orders/:id/lines/:menuItemId/cooking-state",
      async ({ staff, params, body, status }) => {
        return run(
          logAndDie(
            updateCookingState(staff, params.id, params.menuItemId, body.to).pipe(
              Effect.catchTag("KitchenOrderConflict", () =>
                Effect.succeed(status(409, { code: "kitchen_order_conflict" } as const)),
              ),
              Effect.catchTag("KitchenForbidden", () => Effect.succeed(status(403, { code: "forbidden" } as const))),
            ),
          ),
        );
      },
      {
        staffRole: "Staff",
        params: Schema.standardSchemaV1(
          Schema.Struct({
            id: Schema.String.pipe(Schema.nonEmptyString()),
            menuItemId: Schema.String.pipe(Schema.nonEmptyString()),
          }),
        ),
        body: Schema.standardSchemaV1(
          Schema.Struct({
            to: CookingState.annotations({ description: "変更先の調理状況" }),
          }),
        ),
        detail: {
          operationId: "updateCookingState",
          summary: "注文明細全体の調理状況を更新",
          tags: ["調理"],
          description:
            "Staff以上が利用できる。許可される遷移は未調理→調理中、調理中→未調理・完成。取消・競合・保存時の権限喪失は409となり、一覧の再確認が必要。",
        },
        response: {
          200: Schema.standardSchemaV1(CookingStateResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          409: Schema.standardSchemaV1(KitchenConflictResponse),
        },
      },
    );
