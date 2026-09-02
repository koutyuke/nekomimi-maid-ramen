import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

export type AppDependencies = {
  /** 資格情報付きの要求を許可する送信元。画面を配信するホストを指す。 */
  webOrigin: string;
  /**
   * Elysiaの事前コンパイルは`new Function`で処理を組み立てる。Cloudflare Workersが
   * これを許すのはWorkerの起動時だけであり、起動後に組み立てると拒否される。
   * 本番の入口は起動時に呼ぶため既定で有効にし、テストは起動後に組み立てるため無効にする。
   */
  aot?: boolean;
};

// 実行基盤の値は引数で受け取り、この階層からは`cloudflare:workers`を参照しない。
// 画面はこのファイルの型だけを読むため、Workers固有の型が画面側へ漏れない。
export const createApp = ({ webOrigin, aot = true }: AppDependencies) => {
  const app = new Elysia({ adapter: CloudflareAdapter, aot })
    .use(cors({ origin: webOrigin, credentials: true }))
    .get("/health", () => ({ status: "ok" }) as const);

  return aot ? app.compile() : app;
};

export type App = ReturnType<typeof createApp>;
