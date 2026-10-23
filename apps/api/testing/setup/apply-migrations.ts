import { applyD1Migrations, env, reset } from "cloudflare:test";

// isolate 無効時に D1・MIGRATION_DB・Durable Object のデータを次のファイルへ持ち越さない。
await reset();
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
