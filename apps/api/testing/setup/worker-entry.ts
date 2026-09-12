import { env } from "cloudflare:workers";
import { Layer, ManagedRuntime } from "effect";

import { makeDatabaseLive } from "../../src/core/infra/drizzle";
import { WebSocketHub as BaseWebSocketHub } from "../../src/core/infra/websocket";
import { makeStaffRepositoryLive } from "../../src/features/staff/infra/staff.repository.live";
import { canReceiveUpdates } from "../../src/features/staff/public";

const sessions = ManagedRuntime.make(
  makeStaffRepositoryLive(env.OWNER_EMAIL ?? "").pipe(Layer.provide(makeDatabaseLive(env.DB))),
);

// APIのAOTコンパイルを起動せず、同じ接続管理と認可をWorkersの試験環境で使う。
export class WebSocketHub extends BaseWebSocketHub {
  constructor(ctx: DurableObjectState, bindings: Env) {
    super(ctx, bindings, (sessionId) => sessions.runPromise(canReceiveUpdates(sessionId)));
  }
}

export default {
  fetch: () => new Response(null, { status: 501 }),
} satisfies ExportedHandler;
