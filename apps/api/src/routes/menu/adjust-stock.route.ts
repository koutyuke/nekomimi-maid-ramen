import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { MenuItemId } from "../../core/domain/ids";
import { adjustStock, StockQuantity } from "../../features/menu/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

const StockAdjustmentResponse = Schema.Struct({
  menuItemId: Schema.String,
  previousQuantity: StockQuantity,
  quantity: StockQuantity,
  adjustedAt: Schema.String,
});
const StockQuantityInput = Schema.Int.pipe(Schema.nonNegative());

export type AdjustStockRequirements =
  | Effect.Effect.Context<ReturnType<typeof adjustStock>>
  | StaffAccessPluginRequirements;

export const adjustStockRoute = (run: EffectRunner<AdjustStockRequirements>, origin: string) =>
  new Elysia().use(staffAccessPlugin(run, origin)).put(
    "/staff/menu/:menuItemId/stock",
    ({ staff, params, body, set, status }) => {
      set.headers["cache-control"] = "no-store";
      return run(
        logAndDie(
          adjustStock(staff, params.menuItemId, StockQuantity.make(body.quantity)).pipe(
            Effect.map((adjustment) => ({
              menuItemId: adjustment.menuItemId,
              previousQuantity: adjustment.previousQuantity,
              quantity: adjustment.quantity,
              adjustedAt: adjustment.adjustedAt.toISOString(),
            })),
            Effect.catchTag("StockAdjustmentForbidden", () =>
              Effect.succeed(status(403, { code: "forbidden" } as const)),
            ),
          ),
        ),
      );
    },
    {
      staffRole: "Admin",
      detail: {
        operationId: "adjustStock",
        summary: "商品の現在在庫数を登録・修正",
        description: "数え直した現在の数量で在庫を上書きし、変更前後の数量・担当者・日時を記録する。",
        tags: ["在庫管理"],
      },
      params: Schema.standardSchemaV1(Schema.Struct({ menuItemId: MenuItemId })),
      body: Schema.standardSchemaV1(Schema.Struct({ quantity: StockQuantityInput })),
      response: {
        200: Schema.standardSchemaV1(StockAdjustmentResponse),
        401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
        403: Schema.standardSchemaV1(ForbiddenResponse),
      },
    },
  );
