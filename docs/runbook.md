# 開発・運用 Runbook

この文書は、猫耳メイドラーメンの開発環境、検査、配備、Google OAuth、Ownerの移行・復旧を扱う。要件とシステムの振る舞いは[ドキュメント索引](README.md)から確認する。

## 開発環境

[Nix](https://nixos.org/download/)と[direnv](https://direnv.net/)を用意し、リポジトリのルートで実行する。

```sh
direnv allow
pnpm install
```

direnvを使わない場合は、各コマンドを`nix develop --command`の後ろに置く。

### 起動

```sh
pnpm dev                          # 公開サイト・スタッフ画面・API
pnpm --filter @nekomimi/site dev  # 公開サイト
pnpm --filter @nekomimi/staff dev # スタッフ画面
pnpm --filter @nekomimi/api dev   # API
pnpm site sb                      # 公開サイトのStorybook（localhost:6007）
pnpm staff sb                     # スタッフ画面のStorybook（localhost:6006）
```

| 環境 | 公開サイト                   | スタッフ画面                       | API                              |
| ---- | ---------------------------- | ---------------------------------- | -------------------------------- |
| 開発 | `http://localhost:4321`      | `http://localhost:5173`            | `http://localhost:8787`          |
| 本番 | `https://nekomimi-ramen.com` | `https://staff.nekomimi-ramen.com` | `https://api.nekomimi-ramen.com` |

APIの起動後は、`http://localhost:8787/openapi`でAPIリファレンス、`http://localhost:8787/openapi/json`でOpenAPI仕様を確認できる。

### データベース

初回と表定義を変更したときは、ローカルD1へ移行を適用する。

```sh
pnpm --filter @nekomimi/api db:generate       # 表定義から移行ファイルを作る
pnpm --filter @nekomimi/api db:migrate:local  # ローカルD1へ適用する
pnpm --filter @nekomimi/api db:seed:local     # メニューと初期在庫を投入する
pnpm --filter @nekomimi/api db:studio         # Drizzle Studioを開く
```

初期データは`apps/api/seed.sql`で管理する。再実行しても行は重複せず、投入後に変更された説明文、原材料の確認状態、在庫数は上書きしない。本番への初期データ投入は、移行後に`pnpm --filter @nekomimi/api db:seed:remote`を実行する。

### 検査

```sh
pnpm check       # リンター、整形、型検査、試験
pnpm lint
pnpm fmt
pnpm fmt:check
pnpm typecheck
pnpm test
```

コミット時は整形、プッシュ時はリンター、型検査、試験をLefthookが実行する。

## 配備

`main`へ統合すると、GitHub Actionsが変更されたアプリケーションだけを配備する。`packages/core/**`の変更では3つすべてを配備する。

| ワークフロー        | 契機                                 | 内容                                 |
| ------------------- | ------------------------------------ | ------------------------------------ |
| `ci.yml`            | プルリクエスト、`main`               | 静的検査、整形、型検査、試験、ビルド |
| `deploy-api.yml`    | `main`の`apps/api/**`                | 型検査、試験、D1の移行、配備         |
| `deploy-site.yml`   | `main`の`apps/site/**`               | 型検査、試験、ビルド、配備           |
| `deploy-staff.yml`  | `main`の`apps/staff/**`              | 型検査、試験、ビルド、配備           |
| `preview-site.yml`  | 公開サイトを変更するプルリクエスト   | プレビュー作成、Lighthouse計測       |
| `preview-staff.yml` | スタッフ画面を変更するプルリクエスト | プレビュー作成、URL通知              |

配備ジョブはGitHub Environmentの`production`に属する。出店当日は、Settings → Environments → productionでRequired reviewersを有効にして承認待ちへ切り替える。

手元から配備する場合は次を使う。

```sh
pnpm --filter @nekomimi/api exec wrangler deploy
pnpm --filter @nekomimi/site run build && pnpm --filter @nekomimi/site exec wrangler deploy
pnpm --filter @nekomimi/staff run build && pnpm --filter @nekomimi/staff exec wrangler deploy
```

スタッフ同期を変更した場合は、D1の移行、API、スタッフ画面の順に配備し、開いているスタッフ画面を再読み込みする。`apps/api/wrangler.jsonc`の`STAFF_UPDATES`バインディングとSQLite形式のDurable Object移行が必要である。

公開サイトのプレビューでは公開メニューも確認できる。スタッフ画面の`workers.dev`プレビューは本番認証の許可対象外であるため、業務操作は開発環境または本番ホストで確認する。

## Google OAuthの設定

Google OAuthクライアントは「ウェブ アプリケーション」とし、次の戻り先をGoogle Cloudへ登録する。

- 本番: `https://api.nekomimi-ramen.com/auth/google/callback`
- 開発: `http://localhost:8787/auth/google/callback`

開発環境では`apps/api/.dev.vars.example`を`apps/api/.dev.vars`へ複製し、次を設定する。`.dev.vars`はGitへ含めない。

| 設定                   | 内容                                                  |
| ---------------------- | ----------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuthクライアントID                            |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントの秘密情報                    |
| `BETTER_AUTH_SECRET`   | `openssl rand -base64 32`で生成する認証用秘密情報     |
| `OWNER_EMAIL`          | 初回登録でOwnerを付与する学校メール。登録後は省略可能 |

対象の学校ドメインは`apps/api/wrangler.jsonc`の`SCHOOL_DOMAIN`で管理する。D1へ移行を適用してから`pnpm dev`を起動し、スタッフ画面を`localhost`で開く。

本番の秘密情報は、配備先を確認してから対話入力する。`BETTER_AUTH_SECRET`は本番用に別途生成する。

```sh
pnpm --filter @nekomimi/api exec wrangler secret put GOOGLE_CLIENT_ID
pnpm --filter @nekomimi/api exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm --filter @nekomimi/api exec wrangler secret put BETTER_AUTH_SECRET
pnpm --filter @nekomimi/api exec wrangler secret put OWNER_EMAIL
```

認証設定が不足している場合、公開サイトは利用できるが、ログインは503、業務操作は401で拒否される。

## Ownerの移行・交代・復旧

本番DBを変更する前に、対象環境、利用者ID、Googleの`sub`、変更前後のロール、取り消し方針を確認し、DB更新の明示的な承認を得る。作業は営業外に行う。ローカルで試す場合は、以下の`--remote`を`--local`へ置き換える。

既存DBのOwner移行が完了するまで新しいAPIを配備しない。

1. 移行前のAPIで現在のOwnerがログインし、`/auth/session`の利用者IDとOwnerロールを確認する。Cloudflareで対象D1と復元可能なバックアップを確認し、API版、`OWNER_EMAIL`、対象者の保存済みロールを非公開の作業記録へ残す。バックアップには認証用トークンが含まれるためGitへ入れない。
2. 承認後、`pnpm --filter @nekomimi/api db:migrate:remote`で移行を適用する。次の照会で本人の検証済みGoogleアカウントと`GOOGLE_SUBJECT`を確定し、一致しなければ停止する。

   ```sh
   pnpm --filter @nekomimi/api exec wrangler d1 execute nekomimi-ramen --remote --command "SELECT users.id, users.email, users.email_verified, users.role, accounts.account_id FROM users INNER JOIN accounts ON accounts.user_id = users.id WHERE users.id = 'USER_ID' AND accounts.provider_id = 'google';"
   ```

3. 承認された対象だけを変更する。両識別子を確認済みの値へ置き換え、変更件数が1件であること、Ownerとなること、`PRAGMA foreign_key_check`が空であることを確認する。0件またはエラーなら配備しない。

   ```sh
   pnpm --filter @nekomimi/api exec wrangler d1 execute nekomimi-ramen --remote --command "UPDATE users SET role = 'Owner', updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000 WHERE id = 'USER_ID' AND email_verified = 1 AND EXISTS (SELECT 1 FROM accounts WHERE accounts.user_id = users.id AND provider_id = 'google' AND account_id = 'GOOGLE_SUBJECT');"
   pnpm --filter @nekomimi/api exec wrangler d1 execute nekomimi-ramen --remote --command "PRAGMA foreign_key_check;"
   ```

4. 新しいAPIを配備し、既存セッションと再ログインの両方でOwnerとなること、スタッフ一覧取得と在庫修正ができることを確認する。失敗した場合は移行前のAPIへ戻し、承認済み対象のロールを記録した値へ戻す。DBの列や制約は削除せず、古い移行を再適用しない。

Ownerの登録完了をDBと実ログインで確認した後は、`OWNER_EMAIL`を削除できる。別メールを設定すると新規登録時に追加のOwnerとなるため、既存利用者の昇格や交代には使わない。

交代時は、新Ownerの管理操作が成功するまで旧Ownerを降格しない。成功後、旧Ownerを承認済みのロールへ変更し、次の操作と通知接続で新しいロールが適用されることを確認する。

## OAuthの本番公開

Google Auth Platformを変更する前に、公開サイトへ`/privacy`と`/terms`を配備する。Google Cloudプロジェクトの管理権限を持つ開発担当者が次を行う。

1. 未認証でホーム、プライバシーポリシー、利用規約を開き、本文と導線を確認する。
2. 「ブランディング」で、承認済みドメインに`nekomimi-ramen.com`を登録する。ホームページに`https://nekomimi-ramen.com`、プライバシーポリシーに`https://nekomimi-ramen.com/privacy`、利用規約に`https://nekomimi-ramen.com/terms`を設定する。
3. ユーザーサポートメールとデベロッパーの連絡先に、管理担当者が確認できるメールアドレスを設定する。
4. 「データアクセス」で要求スコープが`openid`、`email`、`profile`だけであること、「クライアント」で戻り先がAPIコールバックと一致することを確認する。
5. 「対象」でExternalを維持して本番公開し、ブランド確認を申請する。ドメイン所有権の確認を求められた場合は、プロジェクトの所有者または編集者がGoogle Search Consoleで確認する。
6. テストユーザーに未登録の学校アカウントでログインする。管理下にある学校外のテスト用アカウントでは、Google認証の通過後にアプリが拒否することを確認する。

本番公開またはブランド確認が完了しない場合はテスト状態を維持し、必要な担当者をテストユーザーへ登録する。

設定の根拠は[Googleのブランディング設定](https://support.google.com/cloud/answer/15549049)、[確認要件](https://support.google.com/cloud/answer/13464321)、[OAuth 2.0ポリシー](https://developers.google.com/identity/protocols/oauth2/policies)を参照する。
