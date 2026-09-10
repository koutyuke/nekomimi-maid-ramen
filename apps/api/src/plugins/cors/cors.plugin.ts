import { cors } from "@elysiajs/cors";

import { isPublicOrigin, isTrustedOrigin } from "../../shared/http";

export const corsPlugin = (staffOrigin: string) =>
  cors({
    origin: (request) => {
      const origin = request.headers.get("origin");
      const method =
        request.method === "OPTIONS" ? request.headers.get("access-control-request-method") : request.method;

      // CORS:
      // - 信頼済み送信元: 全経路・全メソッド
      // - 公開送信元: GET /menuのみ
      // - その他: Access-Control-Allow-Originを返さない
      return (
        isTrustedOrigin(origin, staffOrigin) ||
        (isPublicOrigin(origin) && method === "GET" && new URL(request.url).pathname === "/menu")
      );
    },
    credentials: true,
  });
