import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { listOrders } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { OrdersResponse, presentOrders } from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

export type ListOrdersRequirements =
  | Effect.Effect.Context<ReturnType<typeof listOrders>>
  | StaffAccessPluginRequirements;

export const listOrdersRoute = (run: EffectRunner<ListOrdersRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff/orders",
      ({ query, set }) => {
        set.headers["cache-control"] = "no-store";
        return run(
          logAndDie(
            listOrders({ businessDate: query.businessDate }).pipe(
              Effect.map(({ data, revision }) => ({ ...presentOrders(data), revision })),
            ),
          ),
        );
      },
      {
        staffRole: "Staff",
        query: Schema.standardSchemaV1(
          Schema.Struct({
            businessDate: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)),
          }),
        ),
        detail: {
          operationId: "listOrders",
          summary: "確定した注文を取得",
          tags: ["注文"],
          description: "Staff以上が利用できる。指定した営業日の取消済みを除く注文を返す。",
        },
        response: {
          200: Schema.standardSchemaV1(OrdersResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
