import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 1つの試験ファイルで複数回描画するため、試験ごとにDOMを捨てる。
afterEach(() => {
  cleanup();
});
