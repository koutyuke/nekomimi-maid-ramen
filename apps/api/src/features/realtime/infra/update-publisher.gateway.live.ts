import { inArray } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { PersistenceError } from "../../../core/domain/persistence-error";
import { Database } from "../../../core/infra/drizzle";
import { getWebSocketHub } from "../../../core/infra/websocket";
import { UpdatePublisherGateway } from "../application/ports/outbound/update-publisher.gateway";
import type { WebSocketHub } from "../../../core/infra/websocket";

export const makeUpdatePublisherGatewayLive = (namespace: DurableObjectNamespace<WebSocketHub>) =>
  Layer.effect(
    UpdatePublisherGateway,
    Effect.gen(function* () {
      const database = yield* Database;

      return UpdatePublisherGateway.of({
        publish: (scopes) =>
          Effect.gen(function* () {
            const revisions = yield* database.run("通知対象のリビジョン取得", async (db) => {
              const rows = await db
                .select()
                .from(Database.tables.resourceRevisions)
                .where(inArray(Database.tables.resourceRevisions.scope, [...scopes]));
              if (rows.length !== new Set(scopes).size) {
                throw new Error("Missing resource revision");
              }
              return Object.fromEntries(rows.map(({ scope, revision }) => [scope, revision]));
            });
            yield* Effect.tryPromise({
              try: () => getWebSocketHub(namespace).publish(revisions),
              catch: (cause) => new PersistenceError({ operation: "変更通知", cause }),
            });
          }),
      });
    }),
  );
