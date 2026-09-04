import { Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { stockRepositoryMock } from "../src/features/inventory/testing";
import { menuItemRepositoryMock } from "../src/features/visitor-information/testing";

const runtime = ManagedRuntime.make(Layer.mergeAll(menuItemRepositoryMock([]), stockRepositoryMock([])));
const app = createApp({ origin: "https://nekomimi-ramen.com", runtime, aot: false });

describe("GET /health", () => {
  it("応答できる状態を返す", async () => {
    const response = await app.handle(new Request("https://api.nekomimi-ramen.com/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
