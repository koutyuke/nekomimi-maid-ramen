---
schema: decision
id: DEC-SYS-003
title: 実行基盤とデータストア
domain: SYS
requirements:
  - REQ-SYS-002
  - REQ-SYS-004
  - REQ-SYS-006
  - REQ-INV-003
evidence: []
---

# DEC-SYS-003 実行基盤とデータストア

## 結論

Cloudflareへ登録した`nekomimi-ramen.com`の下で、3つのWorkerを別々のホストへ割り当てる。

| ホスト                     | Worker                         | 配信する内容                                     |
| -------------------------- | ------------------------------ | ------------------------------------------------ |
| `nekomimi-ramen.com`       | Site (`nekomimi-ramen-web`)    | Astroでビルドした静的HTML                        |
| `staff.nekomimi-ramen.com` | Staff (`nekomimi-ramen-staff`) | React、Viteでビルドした静的アセット              |
| `api.nekomimi-ramen.com`   | API                            | ElysiaJS、Cloudflare D1、WebSocket、Google OAuth |

いずれもCustom Domainとして割り当て、デプロイは別々に行う。

3つのホストは別オリジンであるため、APIはCORSを設定する。同一サイト内の通信であり、セッションcookieはAPIホスト限定、`HttpOnly`、本番では`Secure`、`SameSite=Lax`とする。スタッフ側からAPIへは資格情報を含めて送る。公開側は資格情報を送らず、公開メニューだけを取得する。CORSの許可リストはAPIの`shared/http`、適用は`plugins/cors`に置く。公開ホストと、このプロジェクトの公開・スタッフWorkerの`koutyuke.workers.dev`プレビューには`GET /menu`だけを許可する。本番の認証と業務操作はスタッフホストだけを許可する。

| 層                   | 採用するもの                                                    |
| -------------------- | --------------------------------------------------------------- |
| 画面                 | 公開側はAstro、スタッフ側はTypeScript、React、Vite              |
| API                  | ElysiaJS(`elysia/adapter/cloudflare-worker`のCloudflareAdapter) |
| 実行基盤             | Cloudflare Workers                                              |
| データストア         | Cloudflare D1、Drizzle ORM                                      |
| 型の共有             | Eden Treaty(`@elysiajs/eden`)                                   |
| スタッフ画面への反映 | Durable ObjectsのHibernation WebSocket                          |
| 認証                 | Google OAuth                                                    |

3つのWorkerを一つのリポジトリで管理する。依存の向きは画面からAPIへの一方向に限り、APIは画面の実装を参照しない。APIはHTTPのインターフェースとして完結させる。

在庫の排他制御は、在庫数量へ`CHECK (quantity >= 0)`を設定し、注文確定の書き込みを一つのバッチとして実行することで行う。在庫が不足する場合は制約違反となり、注文の保存と在庫の減算がともに取り消される。

D1を注文・在庫の唯一の正本とし、出店共通のDurable Objectはスタッフ接続の管理と変更通知を担う。サーバー側でのHTML生成は行わない。

[Cloudflareの静的アセット転送](https://developers.cloudflare.com/workers/static-assets/redirects/)を使い、公開ホストの`/staff`と`/staff/*`は、`/staff`の接頭辞を除いてスタッフホストへ302転送する。スタッフ側の入口は`/`、管理は`/admin`、会計は`/sales`とする。認証後の戻り先もスタッフホストの`/`とする。

## 理由

3つのWorkerへ分けるのは、公開側のデザイン変更、スタッフ側の業務変更、APIの変更を別々に配備できるようにするためである。Workerを再デプロイすると、そのWorkerが保持するWebSocketの接続は切れる。一つにまとめると、画面の小さな修正でも調理画面と受け渡し画面の接続が切れる。分離は境界を構造として保ち、画面側の実装がAPIへ混ざることを防ぐ。

ホストを分けるのは、APIの境界をURLとして明示でき、Custom Domainの割り当てだけで設定が完結するためである。同一ホストのパスで分ければCORSは不要になるが、境界がURLから見えず、将来APIを別の基盤へ移す場合の入口も変わる。

独自ドメインを使うのは、`workers.dev`のサブドメインでは3つのWorkerが別サイトになるためである。別サイトではセッションcookieに`SameSite=None; Secure`が必要になり、Google OAuthの実装が複雑になる。同じ登録可能ドメインの下であれば`SameSite=Lax`のまま共有できる。

一つのリポジトリで管理するのは、Eden TreatyがAPIの型定義を画面へ渡すためである。リポジトリを分けると、型を配布する仕組みか手作業での複製が必要になる。

WebSocketとDurable Objectsを使うのは、業務処理が保存した変更を全スタッフへ即座に通知する接続管理先を一つに集めるためである。[Hibernation API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)で接続を保持し、休止後も接続に付けたセッションIDから権限を照会する。業務更新はHTTPだけで受け付け、通知には変更範囲とリビジョンだけを載せる。認可はスタッフ機能が所有し、共通の接続管理へ判定処理を渡す。

リビジョンは`resource_revisions(scope, revision)`で領域ごとに保持し、D1のトリガーで進める。注文確定・状態変更・在庫変更と同じトランザクションで進むため、保存の取り消しでリビジョンだけが残らない。スタッフ向け一覧もデータとリビジョンを同じ[D1のバッチ](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)で読む。通知漏れを回収するため、通知接続中も30秒ごとにリビジョンを照合し、変更時だけ一覧を取得する。照合APIは各領域が所有し、メニューは`GET /staff/menu/revision`、注文は`GET /staff/orders/revision`を使う。

通知への待ち時間は1秒で打ち切り、失敗を記録して保存済みの結果を成功として返す。通知先の不調によって、成立した注文の結果が端末へ返らなくなることを防ぐ。画面の取得と照合にも5秒の上限を設け、通信不調を表示して再試行できる状態へ戻す。

公開側は静的HTMLと公開メニューの取得だけで足りる。スタッフ用の在庫残数や通知接続を公開側へ広げない。

## 影響

- ドメインの取得と更新に費用が発生する。実行基盤とデータストアは無料枠内で運用する制約とし、配備先の利用量を確認する。
- デプロイ対象が3つになる。営業中の変更は、対象のWorkerだけを再デプロイする。
- APIの公開メニューGETは別オリジンから閲覧できる。認証と業務操作はスタッフホストだけを許可し、スタッフ画面は資格情報を含めて送る。WebSocket接続ではOriginを検証し、接続時と各通知の送信前に現在のセッションとStaff以上の権限を確認する。設定が漏れた場合は、認証が通らない形で現れる。
- 画面はAPIの型定義に依存する。APIの変更は画面の型検査で検出される。
- Cloudflareへの依存が強くなる。移設する場合はWorkers、D1、Durable Objectsを置き換えることになる。
- D1には対話型のトランザクションがない。読み取った値を判断してから書き込む処理は、単一の文か制約で表現する。
- Hibernationを利用しても、接続・通知・認可確認・定期照合の利用量は発生する。[Durable Objectsの料金と無料枠](https://developers.cloudflare.com/durable-objects/platform/pricing/)に照らし、実運用の利用量を確認する。
- 通常時の反映目標は95%が3秒以内、すべてが10秒以内、通知漏れ時は通信可能な前景画面で35秒以内とする。実機・モバイル回線での測定は配備前の確認事項である。詳細は[`SPEC-SYS-004`](../../specs/system-wide.md#spec-sys-004-スタッフ画面への反映時間と復旧時間を測定する)と[`SPEC-SYS-009`](../../specs/system-wide.md#spec-sys-009-スタッフ画面を最新状態へ同期する)に従う。
