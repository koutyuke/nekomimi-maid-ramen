import { createApp } from "./bootstrap/create-app";
import { origin, runtime, upgradeWebSocket } from "./bootstrap/runtime";

export { WebSocketHub } from "./bootstrap/websocket-hub";

export default createApp({
  origin,
  runtime,
  upgradeWebSocket,
});
