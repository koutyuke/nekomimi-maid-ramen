# 猫耳メイドラーメン

文化祭のクラス出店において、来場者への情報提供と、注文受付から調理、受け渡しまでの連携を支援する Web アプリケーションである。

目的、要件、仕様は[`docs/`](docs/README.md)にある。技術構成の判断は[`DEC-SYS-003`](docs/meta/decisions/DEC-SYS-003-technology-stack.md)と[`DEC-SYS-004`](docs/meta/decisions/DEC-SYS-004-development-environment.md)にある。

## 構成

| 作業単位   | デプロイ先               | 内容                                              |
| ---------- | ------------------------ | ------------------------------------------------- |
| `apps/web` | `nekomimi-ramen.com`     | React、Vite、TanStack Router、Mantine             |
| `apps/api` | `api.nekomimi-ramen.com` | ElysiaJS、Drizzle ORM、Cloudflare D1              |

画面は Eden Treaty で `apps/api` の型を読む。依存の向きは画面から API への一方向に限る。

## 準備

[Nix](https://nixos.org/download/)と[direnv](https://direnv.net/)を入れる。

```sh
direnv allow
pnpm install
```

`direnv allow` を実行すると、以降このディレクトリへ入るだけで Node.js と pnpm の版が揃う。direnv を使わない場合は各コマンドを `nix develop --command` の後ろに置く。

## 開発

```sh
pnpm dev                                  # 画面とAPIを同時に起動する
pnpm --filter @nekomimi/web dev           # 画面だけ
pnpm --filter @nekomimi/api dev           # APIだけ
pnpm --filter @nekomimi/web sb            # 画面部品のカタログ
```

画面が呼び出す API の送信元は `VITE_API_ORIGIN` で指定する。未指定の場合は `wrangler dev` の待ち受け先(`http://localhost:8787`)を使う。

## 検査

```sh
pnpm check        # 下の4つをまとめて実行する
pnpm lint         # oxlint。型情報を使う検査を含む
pnpm format       # oxfmt。--check を付けると書き換えずに判定する
pnpm typecheck
pnpm test
```

コミット時に整形と静的検査、プッシュ時に型検査と試験が lefthook で走る。

## 未了の設定

次はまだ行っていない。行うまで `pnpm --filter @nekomimi/api dev` と本番へのデプロイは成立しない。

- Cloudflare で D1 データベースを作り、`apps/api/wrangler.jsonc` の `database_id` を置き換える。
- `nekomimi-ramen.com` と `api.nekomimi-ramen.com` を Custom Domain として割り当てる。
- Google OAuth のクライアントを作り、`apps/api/.dev.vars` と `wrangler secret` へ登録する。
