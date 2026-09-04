import { openapi } from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { Effect, JSONSchema, type ManagedRuntime, Schema } from "effect";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

import { makeRunner } from "./core/adapters/elysia/runner";
import { menuRoutes } from "./routes/menu/menu.route";

export type AppRequirements = Effect.Effect.Context<Parameters<Parameters<typeof menuRoutes>[0]>[0]>;

export type AppDependencies = {
  origin: string;
  runtime: ManagedRuntime.ManagedRuntime<AppRequirements, never>;
  aot?: boolean;
};

export const createApp = ({ origin, runtime, aot = true }: AppDependencies) => {
  const run = makeRunner(runtime);

  const app = new Elysia({ adapter: CloudflareAdapter, aot })
    .use(cors({ origin, credentials: true }))
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
            { name: "メニュー", description: "来店者へ提供するメニュー情報" },
          ],
        },
        mapJsonSchema: { effect: JSONSchema.make },
        scalar: { version: "1.67.0" },
      }),
    )
    .get("/", () => "Hello! This is Nekomimi Maid Ramen!", {
      detail: {
        operationId: "hello",
        summary: "APIの案内を取得",
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
    .use(menuRoutes(run));

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
