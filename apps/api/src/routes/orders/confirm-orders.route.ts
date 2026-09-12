import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { confirmOrder } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import {
  ConfirmedOrderResponse,
  OutOfStockResponse,
  presentConfirmedOrder,
  presentOutOfStock,
  presentUnknownMenuItem,
  RejectedOrderResponse,
} from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessRequirements } from "../../plugins/staff-access";

export type OrderRouteRequirements = Effect.Effect.Context<ReturnType<typeof confirmOrder>> | StaffAccessRequirements;

export const confirmOrderRoutes = (run: EffectRunner<OrderRouteRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .post(
      "/staff/orders",
      async ({ body, status }) => {
        const outcome = await run(
          logAndDie(
            confirmOrder(body).pipe(
              Effect.map((order) => ({ status: 201, body: presentConfirmedOrder(order) }) as const),
              Effect.catchTag("OutOfStock", (error) =>
                Effect.succeed({ status: 409, body: presentOutOfStock(error.shortages) } as const),
              ),
              Effect.catchTag("UnknownMenuItem", (error) =>
                Effect.succeed({ status: 422, body: presentUnknownMenuItem(error.menuItemIds) } as const),
              ),
              Effect.catchTag("InvalidOrderInput", (error) =>
                Effect.succeed({ status: 422, body: { code: "invalid_order", reason: error.reason } } as const),
              ),
            ),
          ),
        );

        return status(outcome.status, outcome.body);
      },
      {
        staffRole: "Staff",
        body: Schema.standardSchemaV1(
          Schema.Struct({
            requestId: Schema.String.pipe(Schema.nonEmptyString(), Schema.maxLength(64)).annotations({
              description: "同じ確定操作を一度だけ成立させるための識別子",
            }),
            lines: Schema.Array(
              Schema.Struct({
                menuItemId: Schema.String.pipe(Schema.nonEmptyString()).annotations({
                  description: "メニュー項目の識別子",
                }),
                quantity: Schema.Int.pipe(Schema.between(1, 10)).annotations({ description: "1個以上10個以下の個数" }),
              }),
            )
              .pipe(Schema.minItems(1))
              .annotations({ description: "確定する注文の明細" }),
          }).annotations({ description: "注文の確定要求" }),
        ),
        detail: {
          operationId: "confirmOrder",
          summary: "注文を確定",
          description: "現在の在庫で確定できる場合に注文を1件保存し、在庫を減らして注文番号を返す。",
          tags: ["注文"],
        },
        response: {
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
          201: Schema.standardSchemaV1(ConfirmedOrderResponse),
          409: Schema.standardSchemaV1(OutOfStockResponse),
          422: Schema.standardSchemaV1(RejectedOrderResponse),
        },
      },
    );
