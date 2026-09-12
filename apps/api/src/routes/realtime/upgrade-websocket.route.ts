import { Effect, Option } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { PersistenceError } from "../../core/domain/persistence-error";
import { canOperate, getConnectionSession } from "../../features/staff/public";
import { isTrustedOrigin } from "../../shared/http";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { StaffAccessRequirements } from "../../plugins/staff-access";

// Workersの101応答をHTTP応答の再構築に通すとwebSocketを失うため、入口から直接返す。
export const upgradeWebSocketRoute = (
  run: EffectRunner<StaffAccessRequirements>,
  origin: string,
  request: Request,
  upgradeWebSocket: (sessionId: string) => Promise<Response>,
) =>
  run(
    logAndDie(
      Effect.gen(function* () {
        if (request.method !== "GET" || !isTrustedOrigin(request.headers.get("origin"), origin)) {
          return Response.json({ code: "forbidden" }, { status: 403 });
        }
        const session = yield* getConnectionSession(request.headers);
        if (Option.isNone(session) || session.value.expiresAt.getTime() <= Date.now()) {
          return Response.json({ code: "authentication_required" }, { status: 401 });
        }
        if (!canOperate(session.value.staff.role, "Staff")) {
          return Response.json({ code: "forbidden" }, { status: 403 });
        }
        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          return new Response(null, { status: 426 });
        }
        return yield* Effect.tryPromise({
          try: () => upgradeWebSocket(session.value.sessionId),
          catch: (cause) => new PersistenceError({ operation: "変更通知への接続", cause }),
        });
      }),
    ),
  ).catch(() => Response.json({ code: "sync_unavailable" }, { status: 503 }));
