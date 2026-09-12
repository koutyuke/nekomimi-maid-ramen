import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { completeHandoff } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { HandoffCompletedResponse, HandoffConflictResponse } from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessRequirements } from "../../plugins/staff-access";

export type CompleteHandoffRequirements =
  | Effect.Effect.Context<ReturnType<typeof completeHandoff>>
  | StaffAccessRequirements;

export const completeHandoffRoute = (run: EffectRunner<CompleteHandoffRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .post(
      "/staff/orders/:id/handoff",
      ({ staff, params, status }) =>
        run(
          logAndDie(
            completeHandoff(staff, params.id).pipe(
              Effect.map(({ id, handedOffAt }) => ({ id, handedOffAt: handedOffAt.toISOString() })),
              Effect.catchTag("HandoffConflict", () =>
                Effect.succeed(status(409, { code: "handoff_conflict" } as const)),
              ),
              Effect.catchTag("HandoffForbidden", () => Effect.succeed(status(403, { code: "forbidden" } as const))),
            ),
          ),
        ),
      {
        staffRole: "Staff",
        params: Schema.standardSchemaV1(Schema.Struct({ id: Schema.String.pipe(Schema.nonEmptyString()) })),
        detail: {
          operationId: "completeHandoff",
          summary: "全商品が完成した注文の受け渡しを一度だけ記録",
          tags: ["受け渡し"],
          description:
            "Staff以上が利用できる。全明細が完成し、未取消・未受け渡しの場合にサーバー時刻を保存する。条件不成立は409。",
        },
        response: {
          200: Schema.standardSchemaV1(HandoffCompletedResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          409: Schema.standardSchemaV1(HandoffConflictResponse),
        },
      },
    );
