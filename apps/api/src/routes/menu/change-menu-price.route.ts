import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { MenuItemId } from "../../core/domain/ids";
import { Price } from "../../core/domain/money";
import { changeMenuPrice } from "../../features/menu/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessPluginRequirements } from "../../plugins/staff-access";

const MenuPriceChangeResponse = Schema.Struct({
  menuItemId: Schema.String,
  price: Price,
  updatedAt: Schema.String,
});
const PriceInput = Schema.Int.pipe(Schema.positive());

export type ChangeMenuPriceRequirements =
  | Effect.Effect.Context<ReturnType<typeof changeMenuPrice>>
  | StaffAccessPluginRequirements;

export const changeMenuPriceRoute = (run: EffectRunner<ChangeMenuPriceRequirements>, origin: string) =>
  new Elysia().use(staffAccessPlugin(run, origin)).put(
    "/staff/menu/:menuItemId/price",
    ({ staff, params, body, set, status }) => {
      set.headers["cache-control"] = "no-store";
      return run(
        logAndDie(
          changeMenuPrice(staff, params.menuItemId, Price.make(body.price)).pipe(
            Effect.map((change) => ({
              menuItemId: change.menuItemId,
              price: change.price,
              updatedAt: change.updatedAt.toISOString(),
            })),
            Effect.catchTag("MenuPriceChangeForbidden", () =>
              Effect.succeed(status(403, { code: "forbidden" } as const)),
            ),
            Effect.catchTag("MenuItemNotFound", () =>
              Effect.succeed(status(404, { code: "menu_item_not_found" } as const)),
            ),
          ),
        ),
      );
    },
    {
      staffRole: "Admin",
      detail: {
        operationId: "changeMenuPrice",
        summary: "商品の現在価格を変更",
        description:
          "以後に確定する注文へ新しい価格を適用する。確定済み注文の価格は変えない。同じ価格への変更は成功として扱い、変更通知を送らない。",
        tags: ["メニュー"],
      },
      params: Schema.standardSchemaV1(Schema.Struct({ menuItemId: MenuItemId })),
      body: Schema.standardSchemaV1(
        Schema.Struct({ price: PriceInput.annotations({ description: "変更後の税込価格（円）。1以上の整数" }) }),
      ),
      response: {
        200: Schema.standardSchemaV1(MenuPriceChangeResponse),
        401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
        403: Schema.standardSchemaV1(ForbiddenResponse),
        404: Schema.standardSchemaV1(Schema.Struct({ code: Schema.Literal("menu_item_not_found") })),
      },
    },
  );
