export { updateNotifierMock as realtimeMock } from "../src/features/realtime/testing";

export const upgradeWebSocketMock = (): Promise<Response> =>
  Promise.reject(new Error("Unexpected realtime connection"));
