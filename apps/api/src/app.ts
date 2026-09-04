import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import type { ManagedRuntime } from "effect";

import { makeRunner } from "./core/adapters/elysia/runner";
import { type MenuRouteServices, menuRoutes } from "./routes/menu/menu.route";

export type AppServices = MenuRouteServices;

export type AppDependencies = {
  origin: string;
  runtime: ManagedRuntime.ManagedRuntime<AppServices, never>;
  aot?: boolean;
};

export const createApp = ({ origin, runtime, aot = true }: AppDependencies) => {
  const run = makeRunner(runtime);

  const app = new Elysia({ adapter: CloudflareAdapter, aot })
    .use(cors({ origin, credentials: true }))
    .get("/", () => {
      return "Hello! This is Nekomimi Maid Ramen!";
    })
    .get("/health", () => ({ status: "ok" }) as const)
    .use(menuRoutes(run));

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
