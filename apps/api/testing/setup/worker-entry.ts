export { WebSocketHub } from "../../src/bootstrap/websocket-hub";

export default {
  fetch: () => new Response(null, { status: 501 }),
} satisfies ExportedHandler;
