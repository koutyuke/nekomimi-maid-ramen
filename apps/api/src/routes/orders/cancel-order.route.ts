import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { cancelOrder } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { OrderCancelledResponse, OrderCancellationConflictResponse } from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type CancelOrderRequirements =
  | Effect.Effect.Context<ReturnType<typeof cancelOrder>>
  | StaffAccessPluginRequirements;

export const cancelOrderRoute = (run: EffectRunner<CancelOrderRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .post(
      "/staff/orders/:id/cancel",
      ({ staff, params, status }) =>
        run(
          logAndDie(
            cancelOrder(staff, params.id).pipe(
              Effect.map(({ id, cancelledAt, cancelledBy }) => ({
                id,
                cancelledAt: cancelledAt.toISOString(),
                cancelledBy,
              })),
              Effect.catchTag("OrderCancellationConflict", () =>
                Effect.succeed(status(409, { code: "order_cancellation_conflict" } as const)),
              ),
              Effect.catchTag("OrderCancellationForbidden", () =>
                Effect.succeed(status(403, { code: "forbidden" } as const)),
              ),
            ),
          ),
        ),
      {
        staffRole: "Staff",
        params: Schema.standardSchemaV1(Schema.Struct({ id: Schema.String.pipe(Schema.nonEmptyString()) })),
        detail: {
          operationId: "cancelOrder",
          summary: "確定注文を取り消し、在庫を一度だけ復元",
          tags: ["注文"],
          description:
            "Staff以上が利用できる。未取消・未受け渡しで完成明細のない注文に限り、在庫復元と担当者・取消日時を一括保存する。条件不成立は409。",
        },
        response: {
          200: Schema.standardSchemaV1(OrderCancelledResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          409: Schema.standardSchemaV1(OrderCancellationConflictResponse),
        },
      },
    );
