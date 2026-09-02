import { treaty } from "@elysiajs/eden";
import type { App } from "@nekomimi/api";

// 本番はビルド時に`VITE_API_ORIGIN`で与える。未指定なら`wrangler dev`の待ち受け先を使う。
const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8787";

// 画面とAPIは別オリジンのため、資格情報を明示しないとセッションcookieが送られない。
export const api = treaty<App>(apiOrigin, {
  fetch: { credentials: "include" },
});
