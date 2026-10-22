import { notifications } from "@mantine/notifications";
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
  // 通知は描画とは別のストアに残るため、次の試験へ持ち越さない。
  notifications.clean();
});
