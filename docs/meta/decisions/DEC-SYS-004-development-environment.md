---
schema: decision
id: DEC-SYS-004
title: 開発環境とツールチェーン
domain: SYS
requirements:
  - REQ-INV-003
  - REQ-SYS-002
evidence: []
---

# DEC-SYS-004 開発環境とツールチェーン

## 結論

一つのリポジトリで2つのWorkerを扱う。実行基盤とデータストアは[`DEC-SYS-003`](DEC-SYS-003-technology-stack.md)で定める。

| 対象               | 採用するもの                                                    |
| ------------------ | --------------------------------------------------------------- |
| 開発環境           | Nix flake + direnv                                              |
| 作業単位の管理     | pnpm workspace + Turborepo                                      |
| 静的検査           | oxlint。型情報を使う検査を`oxlint-tsgolint`で有効にする         |
| 整形               | oxfmt                                                           |
| 試験               | Vitest。APIは`@cloudflare/vitest-pool-workers`でworkerd上を使う |
| Gitフック          | lefthook                                                        |
| 継続的検査         | GitHub Actions                                                  |
| TypeScriptの基本   | `@tsconfig/strictest`                                           |
| 画面の経路         | TanStack Router                                                 |
| 画面の様式         | Tailwind CSS                                                    |
| 画面部品のカタログ | Storybook                                                       |

作業単位は`apps/api`と`apps/web`の2つとし、それぞれ`nekomimi-ramen-api`と`nekomimi-ramen-web`としてデプロイする。

APIは経路定義(`src/app.ts`)とWorkerの入口(`src/index.ts`)に分ける。経路定義は`cloudflare:workers`を参照せず、実行基盤の値は引数で受け取る。画面はこの経路定義の型だけを読む。

依存の版はpnpmのcatalogで一箇所に固定する。公開から1日を経ていない版は取り込まない。

## 理由

Nixとdirenvを使うのは、Node.jsとpnpmの版を各自の設定に依存させないためである。作業する人が一人でも、端末の入れ替えや期間の空きで版がずれる。

型情報を使う検査を有効にするのは、注文の保存と在庫の減算をひとつのバッチとして実行する処理を守るためである。`await`を書き忘れると、エラーが出ないまま在庫だけが不整合になる。この誤りは型情報がなければ検出できない。

TypeScriptを6系に留めるのは、ElysiaJSが型推論を深く使うためである。ElysiaJS自身の開発は5系で行われており、7系との組み合わせは確認されていない。7系はElysiaJSが対応を示した時点で見直す。

公開直後の版を取り込まないのは、供給網への攻撃が発覚するまでの猶予を作るためである。この方針により、実行環境であるworkerdも1日以上前の版になる。Workerの互換性日付は、その版が対応する範囲に収める。

APIを経路定義と入口に分けるのは、画面が`@nekomimi/api`の型を読むときに`cloudflare:workers`まで要求されないようにするためである。分けない場合、画面側の型検査にWorkers固有の型定義が必要になる。

MarkdownとTOMLを整形の対象から外すのは、文書の書式を[ドキュメント管理](../../documentation-management.md)が定めるためである。整形器が独自の規則で書き換えると、その規則と競合する。

## 影響

- 事前コンパイルはWorkerの起動時にしか行えない。Cloudflare Workersが`new Function`を許すのは起動時だけであり、試験は起動後にアプリを組み立てる。そのため試験では事前コンパイルを無効にする。経路の組み立て方が本番と異なる点は、受け入れ確認を本番相当の環境で行うことで補う。
- Workerの互換性日付は、依存の版に合わせて上げる。依存を更新しないまま日付だけを進めると、workerdが対応せず試験が起動しない。
- D1のデータベースは未作成である。`apps/api/wrangler.jsonc`の`database_id`は、`wrangler d1 create`の出力へ置き換えるまで実在しない値である。
- 表定義と移行ファイルは、業務領域ごとの変更で追加する。
- 文書の検査スクリプトは未作成である。実装言語が決まったため、[ドキュメント管理](../../documentation-management.md)の手動確認を自動化できる。
