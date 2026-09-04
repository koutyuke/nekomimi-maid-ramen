import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { type EffectRunner, logAndDie } from "../../core/adapters/elysia/runner";
import { listMenu, type MenuItemRepository } from "../../features/visitor-information";
import { MenuResponse, presentMenu } from "./menu.response";
import type { StockRepository } from "../../features/inventory";

export type MenuRouteServices = MenuItemRepository | StockRepository;

export const menuRoutes = (run: EffectRunner<MenuRouteServices>) =>
  new Elysia().get("/menu", () => run(logAndDie(listMenu().pipe(Effect.map(presentMenu)))), {
    detail: {
      operationId: "listMenu",
      summary: "提供中のメニューを取得",
      description: "表示順に並んだメニューと、販売可否および特定原材料の確認状況を返す。",
      tags: ["メニュー"],
    },
    response: Schema.standardSchemaV1(MenuResponse),
  });
