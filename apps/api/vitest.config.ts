import { readFile } from "node:fs/promises";
import path from "node:path";

import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations(path.join(import.meta.dirname, "drizzle"));
const seedSql = await readFile(path.join(import.meta.dirname, "seed.sql"), "utf8");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      main: "./testing/setup/worker-entry.ts",
      miniflare: { d1Databases: ["MIGRATION_DB"], bindings: { TEST_MIGRATIONS: migrations, TEST_SEED_SQL: seedSql } },
    }),
  ],
  test: {
    setupFiles: ["./testing/setup/apply-migrations.ts"],
  },
});
