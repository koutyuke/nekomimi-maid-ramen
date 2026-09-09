import { openapi } from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { JSONSchema, Schema } from "effect";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import type { ManagedRuntime } from "effect";

import { makeRunner } from "./core/adapters/elysia";
import { googleCallbackRoute } from "./routes/auth/google-callback.route";
import { googleRoute } from "./routes/auth/google.route";
import { logoutRoute } from "./routes/auth/logout.route";
import { sessionRoute } from "./routes/auth/session.route";
import { menuRoutes } from "./routes/menu/menu.route";
import { orderRoutes } from "./routes/orders/orders.route";
import { getAllowedOrigin } from "@nekomimi/core/http";
import type { StaffAccessRequirements } from "./plugins/staff-access";
import type { MenuRouteRequirements } from "./routes/menu/menu.route";
import type { OrderRouteRequirements } from "./routes/orders/orders.route";

export type AppRequirements = MenuRouteRequirements | OrderRouteRequirements | StaffAccessRequirements;

export type AppDependencies = {
  origin: string;
  runtime: ManagedRuntime.ManagedRuntime<AppRequirements, never>;
  aot?: boolean;
};

export const createApp = ({ origin, runtime, aot = true }: AppDependencies) => {
  const run = makeRunner(runtime);

  const app = new Elysia({ adapter: CloudflareAdapter, aot })
    // Plugins
    .use(
      cors({
        origin: getAllowedOrigin(origin),
        credentials: true,
      }),
    )
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
            { name: "メニュー", description: "来店者へ提供するメニュー情報" },
            { name: "注文", description: "会計担当者が確定する注文" },
          ],
        },
        mapJsonSchema: { effect: JSONSchema.make },
        scalar: { version: "1.67.0" },
      }),
    )

    // Handlers
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
    .use(menuRoutes(run))
    .use(sessionRoute(run))
    .use(googleRoute(run))
    .use(googleCallbackRoute(run))
    .use(logoutRoute(run))
    .use(orderRoutes(run, origin));

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
