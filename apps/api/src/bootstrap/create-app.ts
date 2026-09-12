import { openapi } from "@elysia/openapi";
import { JSONSchema, Schema } from "effect";
import { Elysia } from "elysia";
import type { ManagedRuntime } from "effect";

import { cloudflareAdapter, makeRunner } from "../core/adapters/elysia";
import { corsPlugin } from "../plugins/cors/cors.plugin";
import { authRoutes } from "../routes/auth";
import { menuRoutes } from "../routes/menu";
import { ordersRoutes } from "../routes/orders";
import { realtimeRoutes } from "../routes/realtime";
import { staffRoutes } from "../routes/staff";
import type { AuthRoutesRequirements } from "../routes/auth";
import type { MenuRoutesRequirements } from "../routes/menu";
import type { OrdersRoutesRequirements } from "../routes/orders";
import type { UpgradeWebSocket, RealtimeRoutesRequirements } from "../routes/realtime";
import type { StaffRoutesRequirements } from "../routes/staff";

/* eslint-disable typescript/no-duplicate-type-constituents -- 各領域の依存変更を反映するため、現在同じ型でも列挙する。 */
export type AppRequirements =
  | RealtimeRoutesRequirements
  | AuthRoutesRequirements
  | MenuRoutesRequirements
  | OrdersRoutesRequirements
  | StaffRoutesRequirements;
/* eslint-enable typescript/no-duplicate-type-constituents */

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
    .use(realtimeRoutes(run, origin, upgradeWebSocket))
    .use(menuRoutes(run, origin))
    .use(ordersRoutes(run, origin))
    .use(authRoutes(run))
    .use(staffRoutes(run, origin));

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
