import { defineConfig } from "drizzle-kit";

// 移行の適用は `wrangler d1 migrations apply` が行う。
// ここは移行ファイルの生成だけを担うため、接続情報を持たない。
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
