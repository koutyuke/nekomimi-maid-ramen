import { Layer, ManagedRuntime } from "effect";

import { makeDatabaseLive } from "../core/infra/drizzle";
import { WebSocketHub as BaseWebSocketHub } from "../core/infra/websocket";
import { makeStaffRepositoryLive } from "../features/staff/infra/staff.repository.live";
import { canReceiveUpdates } from "../features/staff/public";

export class WebSocketHub extends BaseWebSocketHub {
  constructor(ctx: DurableObjectState, bindings: Env) {
    const sessions = ManagedRuntime.make(
      makeStaffRepositoryLive(bindings.OWNER_EMAIL ?? "").pipe(Layer.provide(makeDatabaseLive(bindings.DB))),
    );
    super(ctx, bindings, (sessionId) => sessions.runPromise(canReceiveUpdates(sessionId)));
  }
}
