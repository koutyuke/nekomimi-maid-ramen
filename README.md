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

## 配備

`main` へ統合すると GitHub Actions が配備する。**変更された Worker だけ**を対象とし、画面の修正で API を巻き込まない。API を再配備すると Server-Sent Events の接続が切れるためである。

| ワークフロー | 契機 | 内容 |
| ------------ | ---- | ---- |
| `deploy-api.yml`  | `main` の `apps/api/**` | 型検査、試験、D1 の移行適用、配備 |
| `deploy-web.yml`  | `main` の `apps/web/**` | 型検査、試験、ビルド、配備 |
| `preview-web.yml` | プルリクエストの `apps/web/**` | プレビュー版の作成と Lighthouse 計測 |

配備するジョブは Environment `production` に属する。出店当日だけ、GitHub の Settings → Environments → production で Required reviewers を有効にすると承認待ちへ切り替わる。ワークフローの変更は要らない。

手元から配備する場合は次を使う。

```sh
pnpm --filter @nekomimi/api exec wrangler deploy
pnpm --filter @nekomimi/web run build && pnpm --filter @nekomimi/web exec wrangler deploy
```

## 未了の設定

次はまだ行っていない。行うまで `pnpm --filter @nekomimi/api dev` と配備は成立しない。

```sh
# 1. Cloudflare にログインする
pnpm --filter @nekomimi/api exec wrangler login
pnpm --filter @nekomimi/api exec wrangler whoami          # アカウントIDを控える

# 2. D1 を作り、出力された database_id を apps/api/wrangler.jsonc へ書き込む
pnpm --filter @nekomimi/api exec wrangler d1 create nekomimi-ramen

# 3. GitHub Actions 用の資格情報を登録する
#    トークンは https://dash.cloudflare.com/profile/api-tokens で
#    「Edit Cloudflare Workers」を元に作り、D1 の編集を加える
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID

# 4. Google OAuth の秘密情報を Worker へ登録する
pnpm --filter @nekomimi/api exec wrangler secret put GOOGLE_CLIENT_ID
pnpm --filter @nekomimi/api exec wrangler secret put GOOGLE_CLIENT_SECRET
```

`nekomimi-ramen.com` と `api.nekomimi-ramen.com` の Custom Domain 割り当ては、初回の配備時に `wrangler` が作成する。Google OAuth のクライアント作成と戻り先 URL の登録は Google Cloud の画面で行う。
