import { treaty } from "@elysiajs/eden";

import type { App } from "@nekomimi/api";

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8787";

// 画面とAPIは別オリジンのため、資格情報を明示しないとセッションcookieが送られない。
export const api = treaty<App>(apiOrigin, {
  fetch: { credentials: "include" },
});
