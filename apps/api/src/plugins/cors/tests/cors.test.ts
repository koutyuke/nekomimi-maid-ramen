import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { corsPlugin } from "../cors.plugin";

const staffOrigin = "https://staff.nekomimi-ramen.com";
const preview = "https://pr-34-nekomimi-ramen-web.koutyuke.workers.dev";
const app = new Elysia({ aot: false })
  .use(corsPlugin(staffOrigin))
  .get("/menu", () => ({ items: [] }))
  .post("/orders", () => "ok")
  .get("/auth/session", () => "ok");
const request = (origin: string, path = "/menu", method = "GET", headers = {}) =>
  app.handle(new Request(`https://api.nekomimi-ramen.com${path}`, { method, headers: { origin, ...headers } }));

describe("SPEC-VIS-002 / SPEC-SYS-006 APIの送信元制限", () => {
  it.each(["https://nekomimi-ramen.com", preview, "https://3b9e6b44-nekomimi-ramen-web.koutyuke.workers.dev"])(
    "公開メニューを許可済みサイト %s から読める",
    async (origin) => {
      expect((await request(origin)).headers.get("access-control-allow-origin")).toBe(origin);
    },
  );
  it.each([
    "https://attacker.example",
    "https://pr-34-nekomimi-ramen-web.other.workers.dev",
    `${preview}.attacker.example`,
    "https://other-project.koutyuke.workers.dev",
    "http://pr-34-nekomimi-ramen-web.koutyuke.workers.dev",
  ])("一覧にない送信元 %s を拒否する", async (origin) => {
    expect((await request(origin)).headers.get("access-control-allow-origin")).toBeNull();
  });
  it("プレビューの公開GETの事前確認だけを許可し、認証・業務操作へ広げない", async () => {
    expect(
      (await request(preview, "/menu", "OPTIONS", { "access-control-request-method": "GET" })).headers.get(
        "access-control-allow-origin",
      ),
    ).toBe(preview);
    expect(
      (await request(preview, "/menu", "OPTIONS", { "access-control-request-method": "POST" })).headers.get(
        "access-control-allow-origin",
      ),
    ).toBeNull();
    expect((await request(preview, "/orders", "POST")).headers.get("access-control-allow-origin")).toBeNull();
    expect((await request(preview, "/auth/session")).headers.get("access-control-allow-origin")).toBeNull();
    expect((await request(staffOrigin, "/orders", "POST")).headers.get("access-control-allow-origin")).toBe(
      staffOrigin,
    );
  });
});
