import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { Revision } from "../../core/domain/revision";
import { getSalesSummary } from "../../features/orders/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

const SalesSummaryResponse = Schema.Struct({
  revision: Revision,
  orderCount: Schema.Int.annotations({ description: "未取消の確定注文の件数" }),
  totalAmount: Schema.Int.annotations({ description: "確定時の合計金額の和（円）" }),
  items: Schema.Array(
    Schema.Struct({
      menuItemId: Schema.String,
      name: Schema.String,
      quantity: Schema.Int.annotations({ description: "販売数" }),
      amount: Schema.Int.annotations({ description: "確定時の単価と個数の積の和（円）" }),
    }),
  ).annotations({ description: "全商品の販売数と売上。表示順に並び、販売数0個の商品も含む" }),
}).annotations({ description: "営業日の売上" });

export type SalesSummaryRequirements =
  | Effect.Effect.Context<ReturnType<typeof getSalesSummary>>
  | StaffAccessPluginRequirements;

export const salesSummaryRoute = (run: EffectRunner<SalesSummaryRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff/sales-summary",
      ({ query, set }) => {
        set.headers["cache-control"] = "no-store";
        return run(
          logAndDie(
            getSalesSummary(query.businessDate).pipe(Effect.map(({ data, revision }) => ({ ...data, revision }))),
          ),
        );
      },
      {
        staffRole: "Admin",
        query: Schema.standardSchemaV1(
          Schema.Struct({ businessDate: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)) }),
        ),
        detail: {
          operationId: "getSalesSummary",
          summary: "営業日の売上を取得",
          tags: ["注文"],
          description: "指定した営業日の未取消の確定注文から、売上合計・注文件数・商品別の販売数と売上を返す。",
        },
        response: {
          200: Schema.standardSchemaV1(SalesSummaryResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
