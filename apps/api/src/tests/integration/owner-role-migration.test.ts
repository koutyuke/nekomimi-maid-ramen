import { applyD1Migrations, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("SPEC-SYS-006 SPEC-SYS-008 Ownerの保存方式の移行", () => {
  it("既存ロール・Googleアカウント・セッションを保持し、承認されたOwner付与後に管理権限が残る", async () => {
    const db = env.MIGRATION_DB;
    await applyD1Migrations(
      db,
      env.TEST_MIGRATIONS.filter((entry) => entry.name < "0010"),
    );
    await db
      .prepare(
        "INSERT INTO users (id, name, email, email_verified, role, created_at, updated_at) VALUES ('owner', 'オーナー', 'owner@gm.ibaraki-ct.ac.jp', 1, 'None', 1000, 1000), ('admin', '管理者', 'admin@gm.ibaraki-ct.ac.jp', 1, 'Admin', 1000, 1000)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO accounts (id, user_id, account_id, provider_id, created_at, updated_at) VALUES ('account', 'owner', 'google-owner', 'google', 1000, 1000)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at) VALUES ('session', 'owner', 'session-token', 9999999999999, 1000, 1000)",
      )
      .run();
    const before = {
      users: (await db.prepare("SELECT * FROM users ORDER BY id").all()).results,
      accounts: (await db.prepare("SELECT * FROM accounts").all()).results,
      sessions: (await db.prepare("SELECT * FROM sessions").all()).results,
    };
    await applyD1Migrations(
      db,
      env.TEST_MIGRATIONS.filter((entry) => entry.name >= "0010"),
    );
    expect((await db.prepare("SELECT * FROM users ORDER BY id").all()).results).toEqual(
      before.users.map((user) => ({ ...user, registration_subject: null })),
    );
    expect((await db.prepare("SELECT * FROM accounts").all()).results).toEqual(before.accounts);
    expect((await db.prepare("SELECT * FROM sessions").all()).results).toEqual(before.sessions);
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await db
      .prepare(
        "UPDATE users SET role = 'Owner' WHERE id = 'owner' AND email_verified = 1 AND EXISTS (SELECT 1 FROM accounts WHERE user_id = users.id AND provider_id = 'google' AND account_id = 'google-owner')",
      )
      .run();
    expect(
      await db
        .prepare(
          "SELECT role FROM users INNER JOIN sessions ON users.id = sessions.user_id WHERE sessions.id = 'session'",
        )
        .first("role"),
    ).toBe("Owner");
    await expect(db.prepare("UPDATE users SET role = 'invalid'").run()).rejects.toThrow();
  });
});
