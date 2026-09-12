import { createApp } from "./bootstrap/create-app";
import { origin, runtime, upgradeWebSocket } from "./bootstrap/runtime";
import { makeRunner } from "./core/adapters/elysia";
import { upgradeWebSocketRoute } from "./routes/realtime/upgrade-websocket.route";

export { WebSocketHub } from "./bootstrap/websocket-hub";

const app = createApp({ origin, runtime });
const run = makeRunner(runtime);

export default {
  fetch: (request: Request) =>
    new URL(request.url).pathname === "/staff/events"
      ? upgradeWebSocketRoute(run, origin, request, upgradeWebSocket)
      : app.fetch(request),
} satisfies ExportedHandler<Env>;
