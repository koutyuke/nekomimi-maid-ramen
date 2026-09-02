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

Cloudflareへ登録した`nekomimi-ramen.com`の下で、2つのWorkerを別々のホストへ割り当てる。

| ホスト                   | Worker | 配信する内容                                              |
| ------------------------ | ------ | --------------------------------------------------------- |
| `nekomimi-ramen.com`     | Web    | React、Viteでビルドした静的アセット                       |
| `api.nekomimi-ramen.com` | API    | ElysiaJS、Cloudflare D1、Server-Sent Events、Google OAuth  |

いずれもCustom Domainとして割り当て、デプロイは別々に行う。

2つのホストは別オリジンであるため、APIはCORSを設定する。両者は同一サイトであるため、セッションcookieは`Domain=nekomimi-ramen.com`を指定して共有し、`SameSite=Lax`のままでよい。画面からの要求は資格情報を含めて送る。

| 層               | 採用するもの                                                     |
| ---------------- | ---------------------------------------------------------------- |
| 画面             | TypeScript、React、Vite                                          |
| API              | ElysiaJS(`elysia/adapter/cloudflare-worker`のCloudflareAdapter)   |
| 実行基盤         | Cloudflare Workers                                               |
| データストア     | Cloudflare D1、Drizzle ORM                                       |
| 型の共有         | Eden Treaty(`@elysiajs/eden`)                                    |
| 調理画面への反映 | Server-Sent Events                                               |
| 認証             | Google OAuth                                                     |

両方のWorkerを一つのリポジトリで管理する。依存の向きは画面からAPIへの一方向に限り、APIは画面の実装を参照しない。APIはHTTPのインターフェースとして完結させる。

在庫の排他制御は、在庫数量へ`CHECK (qty >= 0)`を設定し、注文確定の書き込みを一つのバッチとして実行することで行う。在庫が不足する場合は制約違反となり、注文の保存と在庫の減算がともに取り消される。

Durable Objectsは使わない。サーバー側でのHTML生成も行わない。

## 理由

2つのWorkerへ分けるのは、営業中に画面だけを更新できるようにするためである。Workerを再デプロイすると、そのWorkerが保持するServer-Sent Eventsの接続は切れる。一つにまとめると、画面の小さな修正でも調理画面と受け渡し画面の接続が切れる。分離は境界を構造として保ち、画面側の実装がAPIへ混ざることを防ぐ。

ホストを分けるのは、APIの境界をURLとして明示でき、Custom Domainの割り当てだけで設定が完結するためである。同一ホストのパスで分ければCORSは不要になるが、境界がURLから見えず、将来APIを別の基盤へ移す場合の入口も変わる。

独自ドメインを使うのは、`workers.dev`のサブドメインでは2つのWorkerが別サイトになるためである。別サイトではセッションcookieに`SameSite=None; Secure`が必要になり、Google OAuthの実装が複雑になる。同じ登録可能ドメインの下であれば`SameSite=Lax`のまま共有できる。

一つのリポジトリで管理するのは、Eden TreatyがAPIの型定義を画面へ渡すためである。リポジトリを分けると、型を配布する仕組みか手作業での複製が必要になる。

Server-Sent Eventsを選ぶのは、必要な通信がサーバーから画面への一方向だけであり、`EventSource`が再接続を標準で行うためである。各利用者のモバイル回線を使うため接続は切れる前提であり、再接続処理を自分で書かずに済む価値が大きい。調理状況の更新は画面からサーバーへの通常の要求で足りる。

Durable Objectsを使わないのは、在庫の排他制御がD1の制約とバッチで満たせるためである。Durable Objectsが追加で解決するのは接続の保持だけであり、スタッフの端末は10台程度、注文は2日で数百件のため、Server-Sent Eventsの処理からデータストアを確認する方式で足りる。

サーバー側でHTML生成を行わないのは、要件がそれを必要としないためである。2日間の出店では検索エンジン向けの最適化に意味がなく、来場者向けページはエッジから配信される静的なHTMLで足りる。フレームワークの層を挟むことは、Server-Sent Eventsという最も壊れやすい部分を危険にさらす。必要になった場合はWeb側のWorkerだけを置き換える。

無料枠に収める制約から、VercelとNetlifyはサーバーレス実行で接続を保持できないため採用しない。Fly.ioは新規利用者向けの無料枠がない。Renderの無料枠は一定時間で停止し、再開に時間がかかる。

## 影響

- ドメインの取得と更新に費用が発生する。実行基盤とデータストアは無料枠に収まる。
- デプロイ対象が2つになる。営業中の変更は、対象のWorkerだけを再デプロイする。
- APIはCORSを設定する。画面からの要求は資格情報を含めて送り、Server-Sent Eventsも同様に扱う。設定が漏れた場合は、認証が通らない形で現れる。
- 画面はAPIの型定義に依存する。APIの変更は画面の型検査で検出される。
- Cloudflareへの依存が強くなる。移設する場合はWorkersとD1の両方を置き換えることになる。
- D1には対話型のトランザクションがない。読み取った値を判断してから書き込む処理は、単一の文か制約で表現する。
- Cloudflare Workersの無料枠でServer-Sent Eventsの接続をどれだけ保持できるかは確認していない。保持できない場合は、画面側から定期的に取得する方式へ切り替える。反映時間の目標は[`Q-SYS-005`](../questions/Q-SYS-005-quality-targets.md)で決定する。
