import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia/runner";
import { listMenu } from "../../features/visitor-information";
import { MenuResponse, presentMenu } from "./menu.response";
import type { EffectRunner } from "../../core/adapters/elysia/runner";

export type MenuRouteRequirements = Effect.Effect.Context<ReturnType<typeof listMenu>>;

export const menuRoutes = (run: EffectRunner<MenuRouteRequirements>) =>
  new Elysia().get("/menu", () => run(logAndDie(listMenu().pipe(Effect.map(presentMenu)))), {
    detail: {
      operationId: "listMenu",
      summary: "提供中のメニューを取得",
      description: "表示順に並んだメニューと、販売可否および特定原材料の確認状況を返す。",
      tags: ["メニュー"],
    },
    response: Schema.standardSchemaV1(MenuResponse),
  });
