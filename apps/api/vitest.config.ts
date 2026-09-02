import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// 本番と同じworkerd上で実行する。D1の制約やバッチの挙動を、
// SQLiteの代替実装ではなく実物で確認するため。
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
});
