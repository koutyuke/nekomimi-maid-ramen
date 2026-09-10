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

| ホスト                     | Worker                         | 配信する内容                                              |
| -------------------------- | ------------------------------ | --------------------------------------------------------- |
| `nekomimi-ramen.com`       | Site (`nekomimi-ramen-web`)    | Astroでビルドした静的HTML                                 |
| `staff.nekomimi-ramen.com` | Staff (`nekomimi-ramen-staff`) | React、Viteでビルドした静的アセット                       |
| `api.nekomimi-ramen.com`   | API                            | ElysiaJS、Cloudflare D1、Server-Sent Events、Google OAuth |

いずれもCustom Domainとして割り当て、デプロイは別々に行う。

3つのホストは別オリジンであるため、APIはCORSを設定する。同一サイト内の通信であり、セッションcookieはAPIホスト限定、`HttpOnly`、本番では`Secure`、`SameSite=Lax`とする。スタッフ側からAPIへは資格情報を含めて送る。公開側は資格情報を送らず、公開メニューだけを取得する。CORSの許可リストはAPIの`shared/http`、適用は`plugins/cors`に置く。公開ホストと、このプロジェクトの公開・スタッフWorkerの`koutyuke.workers.dev`プレビューには`GET /menu`だけを許可する。本番の認証と業務操作はスタッフホストだけを許可する。

| 層               | 採用するもの                                                    |
| ---------------- | --------------------------------------------------------------- |
| 画面             | 公開側はAstro、スタッフ側はTypeScript、React、Vite              |
| API              | ElysiaJS(`elysia/adapter/cloudflare-worker`のCloudflareAdapter) |
| 実行基盤         | Cloudflare Workers                                              |
| データストア     | Cloudflare D1、Drizzle ORM                                      |
| 型の共有         | Eden Treaty(`@elysiajs/eden`)                                   |
| 調理画面への反映 | Server-Sent Events                                              |
| 認証             | Google OAuth                                                    |

3つのWorkerを一つのリポジトリで管理する。依存の向きは画面からAPIへの一方向に限り、APIは画面の実装を参照しない。APIはHTTPのインターフェースとして完結させる。

在庫の排他制御は、在庫数量へ`CHECK (qty >= 0)`を設定し、注文確定の書き込みを一つのバッチとして実行することで行う。在庫が不足する場合は制約違反となり、注文の保存と在庫の減算がともに取り消される。

Durable Objectsは使わない。サーバー側でのHTML生成も行わない。

[Cloudflareの静的アセット転送](https://developers.cloudflare.com/workers/static-assets/redirects/)を使い、公開ホストの`/staff`と`/staff/*`は、`/staff`の接頭辞を除いてスタッフホストへ302転送する。スタッフ側の入口は`/`、管理は`/admin`、会計は`/sales`とする。認証後の戻り先もスタッフホストの`/`とする。

## 理由

3つのWorkerへ分けるのは、公開側のデザイン変更、スタッフ側の業務変更、APIの変更を別々に配備できるようにするためである。Workerを再デプロイすると、そのWorkerが保持するServer-Sent Eventsの接続は切れる。一つにまとめると、画面の小さな修正でも調理画面と受け渡し画面の接続が切れる。分離は境界を構造として保ち、画面側の実装がAPIへ混ざることを防ぐ。

ホストを分けるのは、APIの境界をURLとして明示でき、Custom Domainの割り当てだけで設定が完結するためである。同一ホストのパスで分ければCORSは不要になるが、境界がURLから見えず、将来APIを別の基盤へ移す場合の入口も変わる。

独自ドメインを使うのは、`workers.dev`のサブドメインでは3つのWorkerが別サイトになるためである。別サイトではセッションcookieに`SameSite=None; Secure`が必要になり、Google OAuthの実装が複雑になる。同じ登録可能ドメインの下であれば`SameSite=Lax`のまま共有できる。

一つのリポジトリで管理するのは、Eden TreatyがAPIの型定義を画面へ渡すためである。リポジトリを分けると、型を配布する仕組みか手作業での複製が必要になる。

Server-Sent Eventsを選ぶのは、必要な通信がサーバーから画面への一方向だけであり、`EventSource`が再接続を標準で行うためである。各利用者のモバイル回線を使うため接続は切れる前提であり、再接続処理を自分で書かずに済む価値が大きい。調理状況の更新は画面からサーバーへの通常の要求で足りる。

Durable Objectsを使わないのは、在庫の排他制御がD1の制約とバッチで満たせるためである。Durable Objectsが追加で解決するのは接続の保持だけであり、同時利用は最大7台、注文は2日で400件のため、Server-Sent Eventsの処理からデータストアを確認する方式で足りる。

サーバー側でHTML生成を行わないのは、要件がそれを必要としないためである。2日間の出店では検索エンジン向けの最適化に意味がなく、来場者向けページはエッジから配信される静的なHTMLで足りる。フレームワークの層を挟むことは、Server-Sent Eventsという最も壊れやすい部分を危険にさらす。必要になった場合は公開側のWorkerだけを置き換える。

無料枠に収める制約から、VercelとNetlifyはサーバーレス実行で接続を保持できないため採用しない。Fly.ioは新規利用者向けの無料枠がない。Renderの無料枠は一定時間で停止し、再開に時間がかかる。

## 影響

- ドメインの取得と更新に費用が発生する。実行基盤とデータストアは無料枠に収まる。
- デプロイ対象が3つになる。営業中の変更は、対象のWorkerだけを再デプロイする。
- APIの公開メニューGETは別オリジンから閲覧できる。認証と業務操作はスタッフホストだけを許可し、スタッフ画面は資格情報を含めて送る。Server-Sent Eventsもスタッフ向けは同様に扱う。設定が漏れた場合は、認証が通らない形で現れる。
- 画面はAPIの型定義に依存する。APIの変更は画面の型検査で検出される。
- Cloudflareへの依存が強くなる。移設する場合はWorkersとD1の両方を置き換えることになる。
- D1には対話型のトランザクションがない。読み取った値を判断してから書き込む処理は、単一の文か制約で表現する。
- Cloudflare Workersの無料枠でServer-Sent Eventsの接続をどれだけ保持できるかは確認していない。保持できない場合は、画面側から定期的に取得する方式へ切り替える。反映時間の目標は[`Q-SYS-005`](../questions/Q-SYS-005-quality-targets.md)で決定する。
