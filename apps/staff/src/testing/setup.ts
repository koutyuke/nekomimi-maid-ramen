import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { TestWebSocket } from "./websocket";

beforeEach(() => {
  TestWebSocket.instances = [];
  vi.stubGlobal("WebSocket", TestWebSocket);
});

// 1つの試験ファイルで複数回描画するため、試験ごとにDOMを捨てる。
afterEach(() => {
  cleanup();
});
