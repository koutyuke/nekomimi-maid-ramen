import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { listStaffMenu } from "../../features/menu/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { presentMenu, StaffMenuResponse } from "./menu.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessRequirements } from "../../plugins/staff-access";

export type StaffMenuRequirements = Effect.Effect.Context<ReturnType<typeof listStaffMenu>> | StaffAccessRequirements;

export const staffMenuRoute = (run: EffectRunner<StaffMenuRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/staff/menu",
      ({ set }) => {
        set.headers["cache-control"] = "no-store";
        return run(
          logAndDie(
            listStaffMenu().pipe(
              Effect.map(({ data, revision }) => ({
                revision,
                items: presentMenu(data).items.map((item, index) => ({ ...item, quantity: data[index]!.quantity })),
              })),
            ),
          ),
        );
      },
      {
        staffRole: "Staff",
        detail: {
          operationId: "listStaffMenu",
          summary: "在庫残数を含むスタッフ向けメニューを取得",
          tags: ["メニュー"],
        },
        response: {
          200: Schema.standardSchemaV1(StaffMenuResponse),
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
