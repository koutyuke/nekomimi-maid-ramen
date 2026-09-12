import type { D1Migration } from "@cloudflare/vitest-pool-workers";

// テスト実行時だけ渡す束縛。`vitest.config.ts`が移行の一覧と投入SQLをここへ入れる。
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
      TEST_SEED_SQL: string;
      MIGRATION_DB: D1Database;
    }
  }
}
