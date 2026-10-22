import { cors } from "@elysiajs/cors";

import { isTrustedOrigin } from "../../shared/http";

export const corsPlugin = (staffOrigin: string) =>
  cors({
    origin: (request) => isTrustedOrigin(request.headers.get("origin"), staffOrigin),
    credentials: true,
  });
