import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { corsPlugin } from "../cors.plugin";

const staffOrigin = "https://staff.nekomimi-ramen.com";
const app = new Elysia({ aot: false })
  .use(corsPlugin(staffOrigin))
  .get("/staff/menu", () => ({ items: [] }))
  .post("/staff/orders", () => "ok")
  .get("/auth/session", () => "ok");
const request = (origin: string, path = "/staff/menu", method = "GET", headers = {}) =>
  app.handle(new Request(`https://api.nekomimi-ramen.com${path}`, { method, headers: { origin, ...headers } }));

describe("SPEC-SYS-006 APIの送信元制限", () => {
  it("スタッフ画面からの資格情報付きの要求と事前確認を許可する", async () => {
    const preflight = await request(staffOrigin, "/staff/orders", "OPTIONS", {
      "access-control-request-method": "POST",
    });

    expect(preflight.headers.get("access-control-allow-origin")).toBe(staffOrigin);
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
    expect((await request(staffOrigin)).headers.get("access-control-allow-origin")).toBe(staffOrigin);
    expect((await request(staffOrigin, "/staff/orders", "POST")).headers.get("access-control-allow-origin")).toBe(
      staffOrigin,
    );
  });
  it.each([
    "https://nekomimi-ramen.com",
    "https://pr-34-nekomimi-ramen-web.koutyuke.workers.dev",
    "https://pr-34-nekomimi-ramen-staff.koutyuke.workers.dev",
    "https://attacker.example",
    `${staffOrigin}.attacker.example`,
  ])("スタッフ画面以外の送信元 %s を許可しない", async (origin) => {
    for (const response of [
      await request(origin),
      await request(origin, "/staff/menu", "OPTIONS", { "access-control-request-method": "GET" }),
      await request(origin, "/auth/session"),
    ]) {
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    }
  });
});
