import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp({ webOrigin: "https://nekomimi-ramen.com", aot: false });

describe("GET /health", () => {
  it("応答できる状態を返す", async () => {
    const response = await app.handle(new Request("https://api.nekomimi-ramen.com/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
