import { treaty } from "@elysiajs/eden";

import { getAPIBaseURL } from "@nekomimi/core/http";
import type { App } from "@nekomimi/api";

const apiOrigin = getAPIBaseURL(import.meta.env.PROD).origin;

// 画面とAPIは別オリジンのため、資格情報を明示しないとセッションcookieが送られない。
export const api = treaty<App>(apiOrigin, {
  fetch: { credentials: "include" },
});
