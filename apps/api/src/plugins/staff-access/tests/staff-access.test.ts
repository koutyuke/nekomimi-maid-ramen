import { ManagedRuntime } from "effect";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { makeRunner } from "../../../core/adapters/elysia";
import { authenticationGatewayMock, staffFixture } from "../../../features/system-wide/testing";
import { staffAccessPlugin } from "../staff-access.plugin";
import type { Staff } from "../../../features/system-wide/public";

const origin = "https://nekomimi-ramen.com";
const appFor = (staff: Staff | null) => {
  const run = makeRunner(ManagedRuntime.make(authenticationGatewayMock(staff)));
  return new Elysia({ aot: false })
    .use(staffAccessPlugin(run, origin))
    .post("/staff-operation", ({ staff: actor }) => ({ id: actor.id, role: actor.role }), { staffRole: "Staff" })
    .post("/admin-operation", ({ staff: actor }) => ({ id: actor.id, role: actor.role }), { staffRole: "Admin" });
};
const post = (app: ReturnType<typeof appFor>, path: string, requestOrigin: string | null = origin) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: requestOrigin === null ? {} : { origin: requestOrigin },
    }),
  );

describe("SPEC-SYS-006 HTTP入口でのロール制限", () => {
  it("未認証を401で拒否する", async () => {
    expect((await post(appFor(null), "/staff-operation")).status).toBe(401);
  });
  it.each(["Owner", "Admin", "Staff", "None"] as const)("%sの操作を制限し、担当者をハンドラーへ渡す", async (role) => {
    const app = appFor({ ...staffFixture, role });
    const staffResponse = await post(app, "/staff-operation");
    expect(staffResponse.status).toBe(role === "None" ? 403 : 200);
    if (role !== "None") {
      expect(await staffResponse.json()).toEqual({ id: staffFixture.id, role });
    }
    expect((await post(app, "/admin-operation")).status).toBe(role === "Owner" || role === "Admin" ? 200 : 403);
  });
  it.each([null, "https://attacker.example", "https://nekomimi-ramen.com.attacker.example"])(
    "許可していない送信元 %s からの更新を拒否する",
    async (requestOrigin) => {
      expect((await post(appFor(staffFixture), "/staff-operation", requestOrigin)).status).toBe(403);
    },
  );
});
