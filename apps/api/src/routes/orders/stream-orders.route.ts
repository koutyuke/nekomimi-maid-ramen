/* eslint-disable no-await-in-loop -- SSEは一定間隔で順番に権限と注文を確認する。 */
import { Effect, Option, Schema } from "effect";
import { Elysia } from "elysia";

import { logAndDie } from "../../core/adapters/elysia";
import { listOrders } from "../../features/orders/public";
import { canOperate, getCurrentStaff } from "../../features/staff/public";
import { staffAccessPlugin } from "../../plugins/staff-access";
import { AuthenticationRequiredResponse, ForbiddenResponse } from "../auth/auth.response";
import { presentOrders } from "./orders.response";
import type { EffectRunner } from "../../core/adapters/elysia";
import type { ListOrdersRequirements } from "./list-orders.route";

export const streamOrdersRoute = (run: EffectRunner<ListOrdersRequirements>, origin: string) =>
  new Elysia()
    // Plugins
    .use(staffAccessPlugin(run, origin))

    // Endpoints
    .get(
      "/orders/events",
      async function* ({ request, set }) {
        set.headers["cache-control"] = "no-store";
        set.headers["content-type"] = "text/event-stream";
        const encoder = new TextEncoder();
        let previous = "";
        // 1接続がD1の呼び出し回数を使い切らないよう、約20秒で終えてEventSourceの再接続に任せる。
        for (let sample = 0; sample < 10 && !request.signal.aborted; sample += 1) {
          const staff = await run(logAndDie(getCurrentStaff(request.headers)));
          if (Option.isNone(staff) || !canOperate(staff.value.role, "Staff")) {
            yield encoder.encode("event: access-denied\ndata: \n\n");
            return;
          }
          const current = JSON.stringify(await run(logAndDie(listOrders().pipe(Effect.map(presentOrders)))));
          // Workersの応答ストリームには文字列でなくバイト列を渡す。
          yield encoder.encode(`event: ${current === previous ? "heartbeat" : "refresh"}\nretry: 1000\ndata: \n\n`);
          previous = current;
          await run(Effect.sleep("2 seconds"));
        }
      },
      {
        staffRole: "Staff",
        detail: {
          operationId: "streamOrders",
          summary: "調理注文の変更を通知",
          tags: ["調理"],
          description:
            "Staff以上のSSE接続。refreshでGET /ordersを再取得し、heartbeatで接続を確認する。access-deniedでは接続を閉じて権限を再確認する。約20秒ごとに再接続し、接続時は必ずrefreshを返す。",
          responses: {
            200: {
              description: "調理一覧の再取得通知",
              content: { "text/event-stream": { schema: { type: "string" } } },
            },
          },
        },
        response: {
          401: Schema.standardSchemaV1(AuthenticationRequiredResponse),
          403: Schema.standardSchemaV1(ForbiddenResponse),
        },
      },
    );
