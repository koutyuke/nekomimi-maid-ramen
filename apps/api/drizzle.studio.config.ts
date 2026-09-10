import { globSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

const databaseDirectory = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const [databaseFile] = globSync("*.sqlite", {
  cwd: databaseDirectory,
  exclude: ["metadata.sqlite"],
});

if (databaseFile === undefined) {
  throw new Error("ローカル D1 がありません。先に db:migrate:local を実行してください。");
}

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: { url: path.resolve(databaseDirectory, databaseFile) },
});
