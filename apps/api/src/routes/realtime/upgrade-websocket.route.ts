import { Effect, Option } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { PersistenceError } from "../../core/domain/persistence-error";
import { canOperate, getConnectionSession } from "../../features/staff/public";
import { isTrustedOrigin } from "../../shared/http";
import type { EffectRunner } from "../../core/adapters/elysia";

export type UpgradeWebSocket = (sessionId: string) => Promise<Response>;
export type UpgradeWebSocketRequirements = Effect.Effect.Context<ReturnType<typeof getConnectionSession>>;

export const upgradeWebSocketRoute = (
  run: EffectRunner<UpgradeWebSocketRequirements>,
  origin: string,
  upgradeWebSocket: UpgradeWebSocket,
) =>
  new Elysia()
    // Endpoints
    .get(
      "/staff/events",
      ({ request }) =>
        run(
          logAndDie(
            Effect.gen(function* () {
              if (!isTrustedOrigin(request.headers.get("origin"), origin)) {
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
        ).catch(() => Response.json({ code: "sync_unavailable" }, { status: 503 })),
      {
        detail: {
          operationId: "upgradeWebSocket",
          summary: "スタッフ向けの変更通知に接続する",
          tags: ["同期"],
          description: "信頼済みのOriginからStaff以上のセッションでWebSocketへ接続する。",
        },
      },
    );
