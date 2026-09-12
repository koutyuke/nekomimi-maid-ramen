import { openapi } from "@elysia/openapi";
import { JSONSchema, Schema } from "effect";
import { Elysia } from "elysia";
import type { ManagedRuntime } from "effect";

import { cloudflareAdapter, makeRunner } from "../core/adapters/elysia";
import { corsPlugin } from "../plugins/cors/cors.plugin";
import { googleCallbackRoute } from "../routes/auth/google-callback.route";
import { googleRoute } from "../routes/auth/google.route";
import { logoutRoute } from "../routes/auth/logout.route";
import { sessionRoute } from "../routes/auth/session.route";
import { menuRevisionRoute } from "../routes/menu/menu-revision.route";
import { menuRoutes } from "../routes/menu/menu.route";
import { staffMenuRoute } from "../routes/menu/staff-menu.route";
import { completeHandoffRoute } from "../routes/orders/complete-handoff.route";
import { confirmOrderRoutes } from "../routes/orders/confirm-orders.route";
import { listOrdersRoute } from "../routes/orders/list-orders.route";
import { ordersRevisionRoute } from "../routes/orders/orders-revision.route";
import { updateCookingStateRoute } from "../routes/orders/update-cooking-state.route";
import { upgradeWebSocketRoute } from "../routes/realtime/upgrade-websocket.route";
import { listStaffRoute } from "../routes/staff/list-staff.route";
import { updateStaffRoleRoute } from "../routes/staff/update-staff-role.route";
import type { MenuRouteRequirements } from "../routes/menu/menu.route";
import type { CompleteHandoffRequirements } from "../routes/orders/complete-handoff.route";
import type { OrderRouteRequirements } from "../routes/orders/confirm-orders.route";
import type { ListOrdersRequirements } from "../routes/orders/list-orders.route";
import type { UpdateCookingStateRequirements } from "../routes/orders/update-cooking-state.route";
import type { UpgradeWebSocket, UpgradeWebSocketRequirements } from "../routes/realtime/upgrade-websocket.route";
import type { ListStaffRouteRequirements } from "../routes/staff/list-staff.route";
import type { UpdateStaffRoleRouteRequirements } from "../routes/staff/update-staff-role.route";

export type AppRequirements =
  | UpgradeWebSocketRequirements
  | CompleteHandoffRequirements
  | ListOrdersRequirements
  | UpdateCookingStateRequirements
  | MenuRouteRequirements
  | OrderRouteRequirements
  | ListStaffRouteRequirements
  | UpdateStaffRoleRouteRequirements;

export type AppDependencies = {
  origin: string;
  upgradeWebSocket: UpgradeWebSocket;
  runtime: ManagedRuntime.ManagedRuntime<AppRequirements, never>;
  aot?: boolean;
};

export const createApp = ({ origin, runtime, upgradeWebSocket, aot = true }: AppDependencies) => {
  const run = makeRunner(runtime);

  const app = new Elysia({ adapter: cloudflareAdapter, aot })
    // Plugins
    .use(corsPlugin(origin))
    .use(
      openapi({
        documentation: {
          info: {
            title: "Nekomimi Maid Ramen API",
            description: "ねこみみメイドラーメンが提供する API",
            version: "0.0.0",
          },
          tags: [
            { name: "システム", description: "API 自体の情報と稼働状態" },
            { name: "認証", description: "担当者のGoogle認証とセッション管理" },
            { name: "ロール管理", description: "利用者の一覧とロールの付与・剥奪" },
            { name: "メニュー", description: "来店者へ提供するメニュー情報" },
            { name: "受け渡し", description: "完成注文の照合と受け渡し日時の記録" },
            { name: "調理", description: "確定注文の確認と調理状況の更新" },
            { name: "注文", description: "会計担当者が確定する注文" },
            { name: "同期", description: "スタッフ画面間の変更通知" },
          ],
        },
        mapJsonSchema: { effect: JSONSchema.make },
        scalar: { version: "1.67.0" },
      }),
    )

    // Endpoints
    .get("/", () => "Hello! This is Nekomimi Maid Ramen!", {
      detail: {
        operationId: "hello",
        summary: "Hello World",
        tags: ["システム"],
      },
      response: Schema.standardSchemaV1(
        Schema.String.annotations({
          description: "APIを識別するメッセージ",
        }),
      ),
    })
    .get("/health", () => ({ status: "ok" }) as const, {
      detail: {
        operationId: "getHealth",
        summary: "APIの稼働状態を取得",
        tags: ["システム"],
      },
      response: Schema.standardSchemaV1(
        Schema.Struct({
          status: Schema.Literal("ok").annotations({ description: "APIの稼働状態" }),
        }).annotations({ description: "APIの稼働状態" }),
      ),
    })

    // Routes
    .use(upgradeWebSocketRoute(run, origin, upgradeWebSocket))
    .use(menuRevisionRoute(run, origin))
    .use(ordersRevisionRoute(run, origin))
    .use(staffMenuRoute(run, origin))
    .use(listOrdersRoute(run, origin))
    .use(updateCookingStateRoute(run, origin))
    .use(completeHandoffRoute(run, origin))
    .use(menuRoutes(run))
    .use(sessionRoute(run))
    .use(googleRoute(run))
    .use(googleCallbackRoute(run))
    .use(logoutRoute(run))
    .use(confirmOrderRoutes(run, origin))
    .use(listStaffRoute(run, origin))
    .use(updateStaffRoleRoute(run, origin));

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
