import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env["CLOUDFLARE_ACCOUNT_ID"]!,
    databaseId: "fd25a1b6-3b25-4c6c-abbc-754e74bbf07c",
    token: process.env["CLOUDFLARE_API_TOKEN"]!,
  },
});
