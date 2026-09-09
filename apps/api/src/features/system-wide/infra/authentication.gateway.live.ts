import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { google, verifyGoogleIdToken } from "better-auth/social-providers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Option } from "effect";

import { PersistenceError } from "../../../core/domain/persistence-error";
import { Database } from "../../../core/infra/drizzle";
import { AuthenticationGateway } from "../application/ports/outbound/authentication.gateway";
import { resolveRole } from "../domain/staff";
import { isTrustedOrigin } from "@nekomimi/core/http";

export type AuthenticationConfig = {
  apiBaseURL: URL;
  webBaseURL: URL;
  schoolDomain: string;

  googleClientId: string;
  googleClientSecret: string;
  googleCallbackPath: string;

  authenticationResultPath: string;

  secret: string;
  ownerEmail: string;
};

const privateAccountFields = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  scope: null,
};

export const makeAuthenticationGateway = (d1: D1Database, config: AuthenticationConfig) => {
  const db = drizzle(d1);

  const googleProvider = google({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    hd: config.schoolDomain,
  });

  const auth = betterAuth({
    baseURL: config.apiBaseURL.origin,
    basePath: "/auth",
    secret: config.secret,

    database: drizzleAdapter(db, {
      provider: "sqlite",
      transaction: false,
      schema: {
        user: Database.tables.users,
        session: Database.tables.sessions,
        account: Database.tables.accounts,
        verification: Database.tables.verifications,
      },
    }),
    trustedOrigins: (request) => {
      const origin = request?.headers.get("origin") ?? null;
      return isTrustedOrigin(origin, config.webBaseURL.origin) ? [origin] : [];
    },
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        hd: config.schoolDomain,
        redirectURI: new URL(config.googleCallbackPath, config.apiBaseURL).toString(),
        includeGrantedScopes: false,
        disableIdTokenSignIn: true,
        overrideUserInfoOnSignIn: true,
        // コールバックでも署名・宛先・期限を検証し、検証済みの学校アカウントだけを取り込む。
        getUserInfo: async (tokens) => {
          if (!tokens.idToken) {
            return null;
          }

          const claims = await verifyGoogleIdToken({
            token: tokens.idToken,
            audience: config.googleClientId,
          });

          if (!claims || claims["hd"] !== config.schoolDomain || claims["email_verified"] !== true) {
            return null;
          }
          return googleProvider.getUserInfo(tokens);
        },
      },
    },
    user: {
      additionalFields: { role: { type: "string", defaultValue: "None", input: false } },
      validateUserInfo: async ({ user, source }) => {
        if (source.action !== "link-account") {
          return undefined;
        }
        if (!user.id) {
          return { error: "account_not_linked" };
        }
        // D1で初回登録が途中失敗した、権限も認証履歴もない利用者だけを再開する。
        const [storedUser] = await db.select().from(Database.tables.users).where(eq(Database.tables.users.id, user.id));
        const accounts = await db
          .select({ id: Database.tables.accounts.id })
          .from(Database.tables.accounts)
          .where(eq(Database.tables.accounts.userId, user.id))
          .limit(1);
        const sessions = await db
          .select({ id: Database.tables.sessions.id })
          .from(Database.tables.sessions)
          .where(eq(Database.tables.sessions.userId, user.id))
          .limit(1);
        if (storedUser?.role !== "None" || accounts.length > 0 || sessions.length > 0) {
          return { error: "account_not_linked" };
        }
        return undefined;
      },
    },
    session: {
      expiresIn: 60 * 60 * 12,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    account: {
      accountLinking: { enabled: true },
      storeAccountCookie: false,
    },
    advanced: {
      ipAddress: { disableIpTracking: true },
      useSecureCookies: config.apiBaseURL.protocol === "https:",
    },
    telemetry: {
      enabled: false,
    },
    logger: {
      disabled: true,
    },
    onAPIError: {
      errorURL: new URL(config.authenticationResultPath, config.webBaseURL).toString(),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: { ...user, image: null, role: "None" } }),
        },
        update: {
          before: async (user) => ({ data: { ...user, image: null } }),
        },
      },
      session: {
        create: { before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }) },
      },
      account: {
        create: { before: async (account) => ({ data: { ...account, ...privateAccountFields } }) },
        update: { before: async (account) => ({ data: { ...account, ...privateAccountFields } }) },
      },
    },
  });

  return AuthenticationGateway.of({
    request: (request) =>
      Effect.tryPromise({
        try: async () => {
          const origin = request.headers.get("origin");

          if (!isTrustedOrigin(origin, config.webBaseURL.origin)) {
            return Response.json({ code: "forbidden_origin" }, { status: 403 });
          }

          // 呼び出し側に追加スコープ、IDトークン、ロール、戻り先を指定させない。
          return auth.handler(
            new Request(new URL("/auth/sign-in/social", config.apiBaseURL), {
              method: "POST",
              headers: {
                "content-type": "application/json",
                origin,
                cookie: request.headers.get("cookie") ?? "",
              },
              body: JSON.stringify({
                provider: "google",
                callbackURL: new URL(config.authenticationResultPath, origin).toString(),
                errorCallbackURL: new URL(config.authenticationResultPath, origin).toString(),
                disableRedirect: true,
              }),
            }),
          );
        },
        catch: () =>
          new PersistenceError({
            operation: "認証の開始",
            cause: new Error("Authentication failed"),
          }),
      }),
    callback: (request) =>
      Effect.tryPromise({
        try: () => {
          const url = new URL(request.url);
          url.pathname = "/auth/callback/google";
          return auth.handler(new Request(url, request));
        },
        catch: () =>
          new PersistenceError({
            operation: "認証の完了",
            cause: new Error("Authentication failed"),
          }),
      }),
    logout: (request) =>
      Effect.tryPromise({
        try: async () => {
          if (!isTrustedOrigin(request.headers.get("origin"), config.webBaseURL.origin)) {
            return Response.json(
              {
                code: "forbidden_origin",
              },
              { status: 403 },
            );
          }
          return auth.handler(
            new Request(new URL("/auth/sign-out", config.apiBaseURL), {
              method: "POST",
              headers: request.headers,
            }),
          );
        },
        catch: () =>
          new PersistenceError({
            operation: "ログアウト",
            cause: new Error("Authentication failed"),
          }),
      }),
    getStaff: (headers) =>
      Effect.tryPromise({
        try: async () => {
          const session = await auth.api.getSession({
            headers,
            query: { disableCookieCache: true },
          });
          if (!session) {
            return Option.none();
          }
          return Option.some({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: resolveRole(session.user.role, session.user.email, config.ownerEmail),
          });
        },
        catch: () =>
          new PersistenceError({
            operation: "セッションの確認",
            cause: new Error("Session lookup failed"),
          }),
      }),
  });
};
