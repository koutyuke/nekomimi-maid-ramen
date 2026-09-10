import { treaty } from "@elysiajs/eden";

import { getAPIBaseURL } from "@nekomimi/core/http";
import type { App } from "@nekomimi/api";

export const api = treaty<App>(getAPIBaseURL(import.meta.env.PROD).origin, {
  fetch: { credentials: "omit", cache: "no-store" },
});
