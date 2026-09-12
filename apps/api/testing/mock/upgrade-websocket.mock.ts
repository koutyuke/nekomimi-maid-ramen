export const upgradeWebSocketMock = (): Promise<Response> =>
  Promise.reject(new Error("Unexpected realtime connection"));
