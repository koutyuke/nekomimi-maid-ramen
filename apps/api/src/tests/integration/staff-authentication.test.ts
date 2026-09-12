import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer, ManagedRuntime, Option, Schema } from "effect";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../../bootstrap/create-app";
import { makeRunner } from "../../core/adapters/elysia";
import { Database, makeDatabaseLive } from "../../core/infra/drizzle";
import { connectWebSocketHub } from "../../core/infra/websocket";
import { MenuLayer } from "../../features/menu/layer";
import { makeOrdersLayer } from "../../features/orders/layer";
import { makeRealtimeLayer } from "../../features/realtime/layer";
import { StaffRepository } from "../../features/staff/application/ports/outbound/staff.repository";
import { makeStaffLayer } from "../../features/staff/layer";
import { updateStaffRole, Staff } from "../../features/staff/public";
import { upgradeWebSocketRoute } from "../../routes/realtime/upgrade-websocket.route";

const apiOrigin = "https://api.nekomimi-ramen.com";
const origin = "https://staff.nekomimi-ramen.com";
const domain = "gm.ibaraki-ct.ac.jp";
const db = drizzle(env.DB);
const config = {
  apiBaseURL: new URL(apiOrigin),
  webBaseURL: new URL(origin),
  googleCallbackPath: "/auth/google/callback",
  authenticationResultPath: "/",
  googleClientId: "test-google-client",
  googleClientSecret: "test-google-secret",
  schoolDomain: domain,
  secret: "test-only-auth-secret-with-at-least-32-characters",
  ownerEmail: `owner@${domain}`,
};
const appLayer = Layer.mergeAll(
  makeRealtimeLayer(env.STAFF_UPDATES),
  MenuLayer,
  makeOrdersLayer(config.ownerEmail).pipe(
    Layer.provide(Layer.mergeAll(MenuLayer, makeRealtimeLayer(env.STAFF_UPDATES))),
  ),
  makeStaffLayer(env.DB, config),
).pipe(Layer.provide(makeDatabaseLive(env.DB)));
const runtime = ManagedRuntime.make(appLayer);
const app = createApp({ origin, runtime, aot: false });
const handle = (request: Request) =>
  new URL(request.url).pathname === "/staff/sync/events"
    ? upgradeWebSocketRoute(makeRunner(runtime), origin, request, (sessionId) =>
        connectWebSocketHub(env.STAFF_UPDATES, sessionId),
      )
    : app.handle(request);
const session = async (cookie: string) => {
  const response = await handle(new Request(`${apiOrigin}/auth/session`, { headers: { cookie } }));
  const result = Schema.decodeUnknownSync(Schema.Struct({ staff: Schema.NullOr(Staff) }))(await response.json());
  expect(response.headers.get("cache-control")).toBe("no-store");
  return Option.fromNullable(result.staff);
};
const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
const start = () => handle(new Request(`${apiOrigin}/auth/google`, { method: "POST", headers: { origin } }));

const base64url = (value: Uint8Array) =>
  btoa(String.fromCharCode(...value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const encode = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));

const login = async (
  claims: Record<string, unknown> = {},
  options: { initiation?: Response; corruptSignature?: boolean } = {},
) => {
  const response = options.initiation ?? (await start());
  const { url } = Schema.decodeUnknownSync(Schema.Struct({ url: Schema.String }))(await response.json());
  const state = new URL(url).searchParams.get("state");
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  if (!("privateKey" in keys)) {
    throw new Error("Expected an RSA key pair");
  }
  const key = await crypto.subtle.exportKey("jwk", keys.publicKey);
  if (key instanceof ArrayBuffer) {
    throw new Error("Expected a JWK");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ alg: "RS256", kid: "test-key" })}.${encode({ iss: "https://accounts.google.com", aud: config.googleClientId, sub: "google-staff-1", email: `staff@${domain}`, email_verified: true, name: "担当者", picture: "https://example.com/avatar.png", hd: domain, iat: now, exp: now + 3600, ...claims })}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(payload));
  if (options.corruptSignature) {
    new Uint8Array(signature).fill(0);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl = input instanceof Request ? input.url : String(input);
      if (requestUrl === "https://oauth2.googleapis.com/token") {
        return Response.json({
          access_token: "private-access-token",
          refresh_token: "private-refresh-token",
          id_token: `${payload}.${base64url(new Uint8Array(signature))}`,
          token_type: "Bearer",
          expires_in: 3600,
        });
      }
      if (requestUrl === "https://www.googleapis.com/oauth2/v3/certs") {
        return Response.json({ keys: [{ ...key, kid: "test-key", alg: "RS256", use: "sig" }] });
      }
      throw new Error(`Unexpected request: ${requestUrl}`);
    }),
  );
  return handle(
    new Request(`${apiOrigin}/auth/google/callback?code=test-code&state=${state}`, {
      headers: { cookie: cookies(response) },
    }),
  );
};

beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected network request");
    }),
  );
  await db.delete(Database.tables.orderLines);
  await db.delete(Database.tables.orders);
  await db.delete(Database.tables.stocks);
  await db.delete(Database.tables.menuItems);
  await db.delete(Database.tables.sessions);
  await db.delete(Database.tables.accounts);
  await db.delete(Database.tables.users);
  await db.delete(Database.tables.verifications);
});
afterEach(() => {
  vi.unstubAllGlobals();
});
afterAll(() => runtime.dispose());

describe("SPEC-SYS-006 Google認証とD1セッションの接続", () => {
  it("要求するスコープと戻り先を固定し、学校ドメインとPKCEを指定する", async () => {
    const response = await start();
    expect(response.status).toBe(200);
    const { url } = Schema.decodeUnknownSync(Schema.Struct({ url: Schema.String }))(await response.json());
    const params = new URL(url).searchParams;
    expect(params.get("scope")?.split(" ").toSorted()).toEqual(["email", "openid", "profile"]);
    expect(params.get("redirect_uri")).toBe(`${apiOrigin}/auth/google/callback`);
    expect(params.get("hd")).toBe(domain);
    expect(params.get("code_challenge_method")).toBe("S256");
  });
  it("初回はNoneになり、別端末でも同じ利用者としてログインする", async () => {
    const first = await login();
    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe(`${origin}/`);
    const sessionCookie = first.headers.getSetCookie().find((cookie) => cookie.includes("session_token="));
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("Secure");
    expect(sessionCookie?.toLowerCase()).toContain("samesite=lax");
    expect(sessionCookie?.toLowerCase()).not.toContain("domain=");
    expect(Option.getOrNull(await session(cookies(first)))).toMatchObject({ name: "担当者", role: "None" });
    const second = await login();
    expect(Option.getOrNull(await session(cookies(second)))).toMatchObject({ role: "None" });
    expect(await db.select().from(Database.tables.users)).toHaveLength(1);
    expect(await db.select().from(Database.tables.sessions)).toHaveLength(2);
  });
  it.each([{ hd: "other.example" }, { hd: null }, { aud: "another-client" }, { exp: 1 }, { email_verified: false }])(
    "不適合なクレーム %j では利用者もセッションも保存しない",
    async (claims) => {
      const response = await login(claims);
      expect(response.headers.get("location")).toContain("error=");
      expect(await db.select().from(Database.tables.users)).toHaveLength(0);
      expect(await db.select().from(Database.tables.sessions)).toHaveLength(0);
    },
  );
  it("認可要求のhdや追加パラメーターを書き換えても学校外では認証しない", async () => {
    const initiation = await handle(
      new Request(`${apiOrigin}/auth/google?hd=outside.example`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({
          additionalParams: { hd: "outside.example" },
          scopes: ["https://www.googleapis.com/auth/drive"],
          role: "Owner",
          callbackURL: "https://attacker.example",
        }),
      }),
    );
    const { url } = Schema.decodeUnknownSync(Schema.Struct({ url: Schema.String }))(await initiation.clone().json());
    expect(new URL(url).searchParams.get("hd")).toBe(domain);
    expect(new URL(url).searchParams.get("scope")?.split(" ").toSorted()).toEqual(["email", "openid", "profile"]);
    const response = await login({ hd: "outside.example" }, { initiation });
    expect(response.headers.get("location")).toContain(`${origin}/?error=`);
    expect(await db.select().from(Database.tables.sessions)).toHaveLength(0);
  });
  it("署名が改ざんされたIDトークンからセッションを発行しない", async () => {
    const response = await login({}, { corruptSignature: true });
    expect(response.headers.get("location")).toContain("error=");
    expect(await db.select().from(Database.tables.users)).toHaveLength(0);
    expect(await db.select().from(Database.tables.sessions)).toHaveLength(0);
  });
  it("stateが一致しないコールバックを拒否し、ログイン画面へ戻す", async () => {
    const initiation = await start();
    const response = await handle(
      new Request(`${apiOrigin}/auth/google/callback?code=unused&state=altered`, {
        headers: { cookie: cookies(initiation) },
      }),
    );
    expect(response.headers.get("location")).toContain(`${origin}/?error=`);
    expect(await db.select().from(Database.tables.sessions)).toHaveLength(0);
  });
  it("Noneと学校外のログインでは注文も在庫も変わらず、Staffの確定だけが成立する", async () => {
    await db.insert(Database.tables.menuItems).values({
      id: "test-ramen",
      name: "ラーメン",
      price: 500,
      category: "main",
      displayOrder: 1,
      allergenCheckState: "unchecked",
      updatedAt: new Date(),
    });
    await db.insert(Database.tables.stocks).values({ menuItemId: "test-ramen", quantity: 2, updatedAt: new Date() });
    const confirm = (cookie: string, requestId: string) =>
      handle(
        new Request(`${apiOrigin}/staff/orders`, {
          method: "POST",
          headers: { cookie, origin, "content-type": "application/json" },
          body: JSON.stringify({ requestId, lines: [{ menuItemId: "test-ramen", quantity: 1 }] }),
        }),
      );
    const outside = await login({ hd: "outside.example" });
    expect((await confirm(cookies(outside), "outside")).status).toBe(401);
    const none = await login();
    expect((await confirm(cookies(none), "none")).status).toBe(403);
    expect(await db.select().from(Database.tables.orders)).toHaveLength(0);
    expect((await db.select().from(Database.tables.stocks))[0]?.quantity).toBe(2);
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const target = Option.getOrThrow(await session(cookies(none)));
    expect((await changeRole(owner.cookie, target.id, "Staff")).status).toBe(200);
    expect((await confirm(cookies(none), "staff")).status).toBe(201);
    expect((await changeRole(owner.cookie, target.id, "None")).status).toBe(200);
    expect((await confirm(cookies(none), "revoked")).status).toBe(403);
    expect(await db.select().from(Database.tables.orders)).toHaveLength(1);
    expect((await db.select().from(Database.tables.stocks))[0]?.quantity).toBe(1);
  });
  it("初回のアカウント保存に失敗しても再ログインで回復する", async () => {
    await env.DB.prepare(
      "CREATE TRIGGER fail_account BEFORE INSERT ON accounts BEGIN SELECT RAISE(ABORT, 'test account failure'); END",
    ).run();
    try {
      const failed = await login();
      expect(failed.headers.get("location")).toContain("error=");
      expect(await db.select().from(Database.tables.sessions)).toHaveLength(0);
    } finally {
      await env.DB.prepare("DROP TRIGGER fail_account").run();
    }
    const retried = await login();
    expect(Option.getOrNull(await session(cookies(retried)))?.role).toBe("None");
    expect(await db.select().from(Database.tables.users)).toHaveLength(1);
  });
  it("メールが同じ別のGoogleアカウントへ既存の権限を引き継がない", async () => {
    await login();
    await db.update(Database.tables.users).set({ role: "Admin" });
    const otherAccount = await login({ sub: "another-google-subject" });
    expect(otherAccount.headers.get("location")).toContain("error=");
    expect(await db.select().from(Database.tables.accounts)).toHaveLength(1);
    expect(await db.select().from(Database.tables.sessions)).toHaveLength(1);
  });
  it("保存したロールの変更を次の照会で反映する", async () => {
    const response = await login();
    const cookie = cookies(response);
    await db.update(Database.tables.users).set({ role: "Staff" });
    expect(Option.getOrNull(await session(cookie))?.role).toBe("Staff");
    await db.update(Database.tables.users).set({ role: "None" });
    expect(Option.getOrNull(await session(cookie))?.role).toBe("None");
  });
  it("設定されたOwnerは初回からOwnerになる", async () => {
    const response = await login({ email: config.ownerEmail });
    expect(Option.getOrNull(await session(cookies(response)))?.role).toBe("Owner");
  });
  it("ログアウトすると同じセッションを再利用できない", async () => {
    const response = await login();
    const cookie = cookies(response);
    const logout = await handle(
      new Request(`${apiOrigin}/auth/logout`, { method: "POST", headers: { origin, cookie } }),
    );
    expect(logout.status).toBe(200);
    expect(Option.isNone(await session(cookie))).toBe(true);
  });
  it("期限が切れたセッションを拒否する", async () => {
    const response = await login();
    await db.update(Database.tables.sessions).set({ expiresAt: new Date(0) });
    expect(Option.isNone(await session(cookies(response)))).toBe(true);
  });
  it("公開ホストからは認証・ログアウトを許可せずセッションを維持する", async () => {
    const response = await login();
    const cookie = cookies(response);
    const responses = await Promise.all(
      ["/auth/google", "/auth/logout"].map((path) =>
        handle(
          new Request(`${apiOrigin}${path}`, {
            method: "POST",
            headers: { origin: "https://nekomimi-ramen.com", cookie },
          }),
        ),
      ),
    );
    for (const denied of responses) {
      expect(denied.status).toBe(403);
      expect(denied.headers.get("access-control-allow-origin")).toBeNull();
    }
    expect(Option.isSome(await session(cookie))).toBe(true);
  });
  it("外部サイトからの認証操作と未公開のBetter Auth経路を拒否する", async () => {
    expect(
      (
        await handle(
          new Request(`${apiOrigin}/auth/google`, { method: "POST", headers: { origin: "https://attacker.example" } }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await handle(new Request(`${apiOrigin}/auth/update-user`, { method: "POST", headers: { origin } }))).status,
    ).toBe(404);
  });
});

describe("SPEC-SYS-007 認証で不要な個人情報を保存しない", () => {
  it("プロフィール画像、端末情報、Googleのトークンを保存しない", async () => {
    await login();
    const [user] = await db.select().from(Database.tables.users);
    const [account] = await db.select().from(Database.tables.accounts);
    const [storedSession] = await db.select().from(Database.tables.sessions);
    expect(user?.image).toBeNull();
    expect(account).toMatchObject({
      accountId: "google-staff-1",
      accessToken: null,
      refreshToken: null,
      idToken: null,
    });
    expect(storedSession).toMatchObject({ ipAddress: null, userAgent: null });
  });
});

const listStaff = (cookie: string) => handle(new Request(`${apiOrigin}/staff`, { headers: { cookie } }));
const changeRole = (cookie: string, id: string, role: string, requestOrigin = origin) =>
  handle(
    new Request(`${apiOrigin}/staff/${id}/role`, {
      method: "PATCH",
      headers: { cookie, origin: requestOrigin, "content-type": "application/json" },
      body: JSON.stringify({ role }),
    }),
  );
const loggedInStaff = async (claims: Record<string, unknown> = {}) => {
  const cookie = cookies(await login(claims));
  return { cookie, staff: Option.getOrThrow(await session(cookie)) };
};

describe("SPEC-SYS-008 ロールの付与・剥奪", () => {
  it("Ownerが一覧から付与・剥奪し、同じセッションの次の操作に反映する", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const target = await loggedInStaff();
    const response = await listStaff(owner.cookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ staff: expect.arrayContaining([owner.staff, target.staff]) });
    expect((await changeRole(owner.cookie, target.staff.id, "Staff")).status).toBe(200);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe("Staff");
    expect((await changeRole(owner.cookie, target.staff.id, "None")).status).toBe(200);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe("None");
  });
  it("AdminはStaffの付与・剥奪ができ、剥奪後は管理操作ができない", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const admin = await loggedInStaff({ sub: "google-admin", email: `admin@${domain}` });
    const target = await loggedInStaff();
    expect((await changeRole(owner.cookie, admin.staff.id, "Admin")).status).toBe(200);
    expect((await listStaff(admin.cookie)).status).toBe(200);
    expect((await changeRole(admin.cookie, target.staff.id, "Staff")).status).toBe(200);
    expect((await changeRole(admin.cookie, target.staff.id, "None")).status).toBe(200);
    expect((await changeRole(owner.cookie, admin.staff.id, "None")).status).toBe(200);
    expect((await listStaff(admin.cookie)).status).toBe(403);
    expect((await changeRole(admin.cookie, target.staff.id, "Staff")).status).toBe(403);
    const staleActor = { ...admin.staff, role: "Admin" } as const;
    const outcome = await runtime.runPromise(updateStaffRole(staleActor, target.staff.id, "Staff").pipe(Effect.either));
    expect(outcome).toMatchObject({ _tag: "Left", left: { _tag: "StaffForbidden" } });
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe("None");
  });
  it.each([
    ["None", "Admin"],
    ["Staff", "Admin"],
    ["Admin", "Staff"],
    ["Admin", "None"],
  ] as const)("%sから%sへの変更はAdminに拒否し、Ownerに許可する", async (before, after) => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const admin = await loggedInStaff({ sub: "google-admin", email: `admin@${domain}` });
    const target = await loggedInStaff();
    await changeRole(owner.cookie, admin.staff.id, "Admin");
    await changeRole(owner.cookie, target.staff.id, before);
    expect((await changeRole(admin.cookie, target.staff.id, after)).status).toBe(403);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe(before);
    expect((await changeRole(owner.cookie, target.staff.id, after)).status).toBe(200);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe(after);
  });
  it("対象が確認後にAdminへ昇格した場合も、Adminによる剥奪を保存時に拒否する", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const admin = await loggedInStaff({ sub: "google-admin", email: `admin@${domain}` });
    const target = await loggedInStaff();
    await changeRole(owner.cookie, admin.staff.id, "Admin");
    const repository = await runtime.runPromise(StaffRepository);
    const find = repository.find;
    const spy = vi.spyOn(repository, "find").mockImplementation((id) =>
      find(id).pipe(
        Effect.tap(() =>
          Effect.promise(async () => {
            await db.update(Database.tables.users).set({ role: "Admin" }).where(eq(Database.tables.users.id, id));
          }),
        ),
      ),
    );
    try {
      expect((await changeRole(admin.cookie, target.staff.id, "None")).status).toBe(403);
      expect(Option.getOrThrow(await session(target.cookie)).role).toBe("Admin");
    } finally {
      spy.mockRestore();
    }
  });
  it("未認証では一覧も変更も利用できない", async () => {
    const target = await loggedInStaff();
    expect((await listStaff("")).status).toBe(401);
    expect((await changeRole("", target.staff.id, "Admin")).status).toBe(401);
  });
  it.each(["None", "Staff"] as const)("%sは一覧も変更も利用できない", async (role) => {
    const target = await loggedInStaff();
    await db.update(Database.tables.users).set({ role });
    expect((await listStaff(target.cookie)).status).toBe(403);
    expect((await changeRole(target.cookie, target.staff.id, "Admin")).status).toBe(403);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe(role);
  });
  it("Owner・自分自身の変更とOwnerの付与を拒否し、保存値を変えない", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const admin = await loggedInStaff();
    expect((await changeRole(owner.cookie, admin.staff.id, "Admin")).status).toBe(200);
    const before = await db.select().from(Database.tables.users);
    expect((await changeRole(admin.cookie, owner.staff.id, "None")).status).toBe(403);
    expect((await changeRole(owner.cookie, owner.staff.id, "Staff")).status).toBe(403);
    expect((await changeRole(admin.cookie, admin.staff.id, "None")).status).toBe(403);
    expect((await changeRole(owner.cookie, admin.staff.id, "Owner")).status).toBe(422);
    expect(await db.select().from(Database.tables.users)).toEqual(before);
  });
  it("不正な送信元と存在しない対象では更新しない", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const target = await loggedInStaff();
    expect((await changeRole(owner.cookie, target.staff.id, "Admin", "https://attacker.example")).status).toBe(403);
    expect((await changeRole(owner.cookie, target.staff.id, "Admin", "")).status).toBe(403);
    expect((await changeRole(owner.cookie, "missing", "Admin")).status).toBe(404);
    expect(Option.getOrThrow(await session(target.cookie)).role).toBe("None");
  });
});

describe("SPEC-SYS-008 保存失敗と未登録の利用者", () => {
  it("保存に失敗した場合に成功を返さず、再試行できる", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const target = await loggedInStaff();
    await env.DB.prepare(
      "CREATE TRIGGER fail_role BEFORE UPDATE OF role ON users BEGIN SELECT RAISE(ABORT, 'PRIVATE_ROLE_FAILURE'); END",
    ).run();
    try {
      const response = await changeRole(owner.cookie, target.staff.id, "Staff");
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("PRIVATE_ROLE_FAILURE");
      expect(Option.getOrThrow(await session(target.cookie)).role).toBe("None");
    } finally {
      await env.DB.prepare("DROP TRIGGER fail_role").run();
    }
    expect((await changeRole(owner.cookie, target.staff.id, "Staff")).status).toBe(200);
  });
  it("Googleアカウントの登録が完了していない利用者を一覧と付与対象から除く", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    await db.insert(Database.tables.users).values({
      id: "incomplete",
      name: "未完了",
      email: `incomplete@${domain}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const response = await listStaff(owner.cookie);
    expect(await response.json()).toEqual({ staff: [owner.staff] });
    expect((await changeRole(owner.cookie, "incomplete", "Staff")).status).toBe(404);
  });
});

describe("SPEC-SYS-006 調理・受け渡しデータの権限境界", () => {
  const kitchen = (
    cookie: string,
    path = "/staff/orders?businessDate=2026-10-24",
    body?: unknown,
    requestOrigin = origin,
  ) =>
    handle(
      new Request(`${apiOrigin}${path}`, {
        method: body === undefined ? "GET" : "PATCH",
        headers: { cookie, origin: requestOrigin, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  it.each(["anonymous", "None"])("%sは一覧・通知・更新を利用できない", async (role) => {
    const cookie = role === "None" ? (await loggedInStaff()).cookie : "";
    const status = role === "None" ? 403 : 401;
    expect((await kitchen(cookie)).status).toBe(status);
    expect((await kitchen(cookie, "/staff/sync/events")).status).toBe(status);
    expect((await kitchen(cookie, "/staff/menu/revision")).status).toBe(status);
    expect((await kitchen(cookie, "/staff/orders/revision")).status).toBe(status);
    expect((await kitchen(cookie, "/staff/menu")).status).toBe(status);
    expect((await kitchen(cookie, "/staff/orders/missing/lines/ramen/cooking-state", { to: "cooking" })).status).toBe(
      status,
    );
    expect((await kitchen(cookie, "/staff/orders?businessDate=2026-10-24")).status).toBe(status);
    expect(
      (
        await handle(
          new Request(`${apiOrigin}/staff/orders/missing/handoff`, {
            method: "POST",
            headers: { cookie, origin },
          }),
        )
      ).status,
    ).toBe(status);
  });
  it("認証済みでも信頼できない送信元からは更新できない", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    expect((await kitchen(owner.cookie)).status).toBe(200);
    expect(
      (
        await kitchen(
          owner.cookie,
          "/staff/orders/missing/lines/ramen/cooking-state",
          { to: "cooking" },
          "https://attacker.example",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handle(
          new Request(`${apiOrigin}/staff/orders/missing/handoff`, {
            method: "POST",
            headers: { cookie: owner.cookie, origin: "https://attacker.example" },
          }),
        )
      ).status,
    ).toBe(403);
  });
  it("接続中に権限を失ったら通知を止める", async () => {
    const owner = await loggedInStaff({ sub: "google-owner", email: config.ownerEmail });
    const staff = await loggedInStaff();
    await changeRole(owner.cookie, staff.staff.id, "Staff");
    const response = await handle(
      new Request(`${apiOrigin}/staff/sync/events`, {
        headers: { cookie: staff.cookie, origin, upgrade: "websocket" },
      }),
    );
    expect(response.status).toBe(101);
    const socket = response.webSocket!;
    socket.accept();
    const messages: unknown[] = [];
    socket.addEventListener("message", (event) => messages.push(event.data));
    const closed = new Promise<number>((resolve) =>
      socket.addEventListener("close", (event) => resolve(event.code), { once: true }),
    );
    try {
      await changeRole(owner.cookie, staff.staff.id, "None");
      await env.STAFF_UPDATES.getByName("nekomimi-maid-ramen").publish({ orders: 1 });
      expect(await closed).toBe(1008);
      expect(messages).toEqual([]);
      expect((await kitchen(staff.cookie, "/staff/orders/revision")).status).toBe(403);
      expect((await kitchen(staff.cookie, "/staff/menu")).status).toBe(403);
    } finally {
      socket.close();
    }
  });
});
