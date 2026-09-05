import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia/runner";
import { confirmOrder } from "../../features/sales";
import {
  ConfirmedOrderResponse,
  OutOfStockResponse,
  presentConfirmedOrder,
  presentOutOfStock,
  presentUnknownMenuItem,
  RejectedOrderResponse,
} from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia/runner";
import type { ConfirmOrderInput } from "../../features/sales";

export type OrderRouteRequirements = Effect.Effect.Context<ReturnType<typeof confirmOrder>>;

const ConfirmOrderRequest = Schema.Struct({
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
}).annotations({ description: "注文の確定要求" });

const confirmOrderOutcome = (input: ConfirmOrderInput) =>
  confirmOrder(input).pipe(
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
  );

export const orderRoutes = (run: EffectRunner<OrderRouteRequirements>) =>
  new Elysia().post(
    "/orders",
    async ({ body, status }) => {
      const outcome = await run(logAndDie(confirmOrderOutcome(body)));

      return status(outcome.status, outcome.body);
    },
    {
      body: Schema.standardSchemaV1(ConfirmOrderRequest),
      detail: {
        operationId: "confirmOrder",
        summary: "注文を確定",
        description: "現在の在庫で確定できる場合に注文を1件保存し、在庫を減らして注文番号を返す。",
        tags: ["注文"],
      },
      response: {
        201: Schema.standardSchemaV1(ConfirmedOrderResponse),
        409: Schema.standardSchemaV1(OutOfStockResponse),
        422: Schema.standardSchemaV1(RejectedOrderResponse),
      },
    },
  );
