import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

const preserveWebSocket = <Args extends unknown[]>(map: (response: unknown, ...args: Args) => unknown) =>
  function mapResponse(response: unknown, ...args: Args): unknown {
    if (response instanceof Promise) {
      return response.then((resolved) => mapResponse(resolved, ...args));
    }
    // Elysia 1.4.30の応答再構築ではWorkers固有のwebSocketが失われる。
    if (response instanceof Response && response.status === 101 && "webSocket" in response && response.webSocket) {
      return response;
    }
    return map(response, ...args);
  };

export const cloudflareAdapter = {
  ...CloudflareAdapter,
  handler: {
    ...CloudflareAdapter.handler,
    mapResponse: preserveWebSocket(CloudflareAdapter.handler.mapResponse.bind(CloudflareAdapter.handler)),
    mapEarlyResponse: preserveWebSocket(CloudflareAdapter.handler.mapEarlyResponse.bind(CloudflareAdapter.handler)),
    mapCompactResponse: preserveWebSocket(CloudflareAdapter.handler.mapCompactResponse.bind(CloudflareAdapter.handler)),
  },
};
