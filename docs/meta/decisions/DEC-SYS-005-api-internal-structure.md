---
schema: decision
id: DEC-SYS-005
title: APIの内部構造とエラー処理
domain: SYS
requirements:
  - REQ-INV-003
  - REQ-SYS-002
  - REQ-SYS-008
evidence: []
---

# DEC-SYS-005 APIの内部構造とエラー処理

## 結論

APIの内部を業務領域で縦割りにし、領域の中を層で分ける。エラー処理、型定義、依存の解決はEffect(`effect`、3.22系)で行う。

APIを追加・変更するときは、[ファイルの切り方](#ファイルの切り方)で処理の置き場所を決め、[HTTPの境界](#httpの境界)と[権限を伴う更新](#権限を伴う更新)で入力・応答・保存時の条件を確認する。

```
apps/api/
├── src/
│   ├── core/            複数領域が共有する、レイヤーに属するもの
│   │   ├── domain/      共有する識別子、金額、保存先の失敗を表す型
│   │   ├── infra/       D1とDrizzleの実体、全表の定義
│   │   └── adapters/    Effectをルートハンドラへ繋ぐ処理
│   ├── shared/          特定の領域やレイヤーに属さないもの
│   │   └── http/        API共通のHTTP方針。入口は`index.ts`
│   ├── features/        業務領域ごと(inventory、visitor-information、…)
│   │   └── {領域}/
│   │       ├── domain/       概念ごとに1ファイル(stock.ts、menu-item.ts、…)
│   │       ├── application/
│   │       │   ├── ports/
│   │       │   │   ├── inbound/   領域が外部へ提供する契約
│   │       │   │   └── outbound/  領域が外部へ要求する契約
│   │       │   ├── facades/       inboundポートの実装
│   │       │   └── use-cases/     業務処理
│   │       ├── adapters/     接続先の領域ごとに置く他領域との接続
│   │       ├── infra/        保存先を使うcommands、repositories
│   │       ├── testing/      fixtures、mocks。入口は`testing/index.ts`
│   │       ├── public.ts     この領域の公開面
│   │       └── layer.ts      この領域の実装を組み立てる
│   ├── routes/
│   │   └── {経路}/
│   │       ├── {操作}.route.ts     経路の定義
│   │       ├── {経路}.response.ts  応答の形と組み立て
│   │       └── tests/
│   ├── tests/
│   │   └── integration/     APIの入口から複数領域と保存先を通す統合テスト
│   ├── app.ts           経路の合成。画面が読む型の正本
│   └── index.ts         Workerの入口。実装の解決はここだけで行う
└── testing/
    ├── env.d.ts         テスト実行時だけ使う型宣言
    └── setup/           テスト環境の入口と初期化
```

領域の名前は[ドキュメント管理](../../documentation-management.md)の業務領域に合わせる。

### coreとsharedの公開入口

`core/adapters`と`core/infra`は、`core/{layer}/{module}/index.ts`をモジュールごとの唯一の公開入口とする。`core`全体や層全体をまとめる`index.ts`は作らない。モジュール外からはディレクトリを指定して読み込み、内部ファイルへの直接参照は`no-restricted-imports`で禁止する。同じモジュール内の実装とテストは内部ファイルを直接参照してよい。公開入口は既存の層間の依存制限を緩めない。

- `core/adapters/elysia`は`logAndDie`、`makeRunner`、`EffectRunner`を公開する。
- `core/infra/drizzle`は`Database`、`makeDatabaseLive`を公開する。

`core/domain`は`index.ts`を作らず、`ids`、`money`、`persistence-error`のように概念ごとのファイルを直接参照する。これらはそれぞれが公開するドメインの定義であり、インポート先に概念名を残す。

`shared`には、特定の業務領域にも`domain`、`application`、`adapters`、`infra`の各レイヤーにも属さない、API内で共有する処理と定数を置く。`shared/{module}/index.ts`をモジュールごとの唯一の公開入口とし、モジュール外から内部ファイルを直接参照しない。`shared`は`src/core`、`features`、`routes`、`plugins`を参照しない。HTTPの送信元判定は`shared/http`から公開する。

### 表定義

すべての表を`core/infra/drizzle/schema.ts`に置く。業務領域ごとに分けない。マイグレーション生成設定はこのファイルを参照する。

DBモジュールの外では`core/infra/drizzle`から読み込み、テーブルは`Database.tables.orders`のように参照する。`Database.tables`は接続に依存しない静的な定義であり、注入した`database.run`がDB操作を実行する。テーブルをローカル変数へ取り出す必要がある場合は、`ordersTable`のように`Table`を付け、テーブルであることを名前に残す。

### ファイルの切り方

`domain`のファイルは種類ではなく概念で切る。エンティティ、そのエンティティだけが使うバリューオブジェクト、業務判定の関数を同じファイルへ入れる。バリューオブジェクトを独立したファイルへ出すのは、同じ領域の2つ以上のエンティティが使うときだけである。2つ以上の領域が使うものは`core/domain`へ置く。

ルートはHTTPメソッドとパスの組み合わせごとに`{操作}.route.ts`へ分ける。同じ対象を扱っていても、一覧取得と更新は別ファイルにする。ルートには入力の検証、ユースケースの呼び出し、HTTP応答への変換を置き、業務規則や保存先の操作は各領域へ置く。

ユースケースは一つの業務目的ごとに`application/use-cases/{操作}.ts`へ分ける。ファイル名に`.usecase`は付けない。一覧取得とロール更新のように独立した操作は分け、同じ操作の補助関数は必要に応じて同じファイルに置く。ルートの数に合わせて業務処理を複製せず、同じ業務目的には同じユースケースを使う。

スタッフ管理では、次の単位で分ける。パスは`apps/api/src/`からの相対パスである。

| エンドポイント          | ルート                                    | ユースケース                                                      |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `GET /staff`            | `routes/staff/list-staff.route.ts`        | `features/system-wide/application/use-cases/list-staff.ts`        |
| `PATCH /staff/:id/role` | `routes/staff/update-staff-role.route.ts` | `features/system-wide/application/use-cases/update-staff-role.ts` |

業務領域の内側にバレルを作らない。

`infra/commands`には、ユースケースを単位として状態を変更する保存先の実装を置く。一つの原子的な操作で複数の表を更新する実装も、その操作を所有する領域へ置く。ファイル名は`{操作}.command.live.ts`とする。ここでいうコマンドは保存先を操作する`outbound`ポートであり、入力CommandとそのHandlerに相当するユースケースは`application`へ置く。`infra/repositories`には、集約またはエンティティを単位とする汎用的な永続化を置き、ファイル名は`{対象}.repository.live.ts`とする。`adapters`には、他領域が公開するポートを自領域の出力ポートへ適合させる実装を置く。

### ルートの組み立てとコメント

`app.ts`と各`.route.ts`では、登録する処理のまとまりを次の英語コメントで区切る。該当する処理がある区分だけを書き、区分の間に空行を入れる。

| コメント       | 対象                                     | 例                                                       |
| -------------- | ---------------------------------------- | -------------------------------------------------------- |
| `// Plugins`   | 共通プラグインの登録                     | `.use(cors(...))`、`.use(staffAccessPlugin(...))`        |
| `// Endpoints` | そのファイルで直接定義するエンドポイント | `.get("/health", ...)`、`.patch("/staff/:id/role", ...)` |
| `// Routes`    | 別ファイルで定義したルートの登録         | `.use(listStaffRoute(...))`                              |

`app.ts`では共通プラグイン、直接定義するエンドポイント、各領域のルートの順に並べる。`/`と`/health`は`app.ts`に直接定義する。各`.route.ts`では必要なプラグインを登録してから、一つのエンドポイントを定義する。

ハンドラーはエンドポイントへ渡す処理関数を指すため、エンドポイント定義全体の見出しには`// Endpoints`を使う。これらの区分以外のコメントは日本語で、コードだけでは分からない判断理由や制約を補う。

### ポートと実装の命名

ポートを表す`Context.Tag`には、業務上の対象に役割を示すサフィックスを付ける。領域が外部へ提供する`inbound`ポートは`Facade`、別領域や外部サービスへ要求する`outbound`ポートは`Gateway`、集約またはエンティティ単位の永続化は`Repository`、ユースケース単位の原子的な永続化は`Command`とする。ユースケースは動詞から始まる関数名とし、役割のサフィックスを付けない。

ポートのファイル名は`{対象}.{役割}.ts`、具象実装はポート名とファイル名へ`Live`を付けて`{対象}.{役割}.live.ts`とする。他領域と接続するGatewayの実装は`adapters/{接続先領域}/`へ置く。`adapters`と`Gateway`が実装の役割を表すため、`adapters/gateways/`や実装名への`Adapter`の追加は行わない。

関数名は、可否の判定と状態を変える操作を区別する。`canOperate`や`canChangeRole`は可否を返す判定とし、有効化する操作を表す`enable`へ置き換えない。保存値の更新は`updateRole`のように表す。業務操作には`confirmOrder`のように目的を表す動詞を使い、すべてを`update`へ揃えない。

一覧取得の`list`と全件取得を表す`findAll`は、取得対象や絞り込みの意味に合わせて選ぶ。`StaffRepository.list`はGoogleアカウントの登録を完了した利用者の一覧を返す。ポートのメソッド名を変更するときは、具象実装、呼び出し元、テスト用実装も同時に揃える。

### 領域の公開面

領域の外から読めるのは`features/{領域}/public.ts`だけである。ここへ載せるのは、他領域のアダプターや経路が必要とする`inbound`ポート、HTTPの境界で使うユースケースと型、業務エラーである。コマンドやリポジトリなど永続化の詳細や領域内の接続に使う`outbound`ポートは公開面へ載せない。

たとえば在庫領域は`InventoryAvailabilityFacade`とその要求・不足のDTOを公開し、`StockRepository`、`Stock`、`isSellable`は領域内に閉じる。来場者向け情報領域は`MenuItemCatalogFacade`を公開し、`MenuItemRepository`とメニュー表示専用の`MenuItemAvailabilityGateway`は領域内に閉じる。販売領域は注文確定のユースケースとHTTP境界で必要な型を公開し、`OrderConfirmationCommand`、`OrderRepository`、`OrderPricingGateway`、`OrderStockAvailabilityGateway`は領域内に閉じる。

`layer.ts`は公開面へ載せない。`layer.ts`は保存先の実装を読むため、公開面へ載せるとルートとユースケースから実装へ到達でき、`app.ts`の型にD1とDrizzleの型定義が漏れる。本番コードで`layer.ts`を読むのは`src/index.ts`だけである。

テスト用の`fixtures`と`mocks`は`features/{領域}/testing/index.ts`を入口とする。

### テストの配置

一つの概念、層、経路に閉じるテストは対象の隣の`tests/`へ置く。保存先へ一括保存するコマンドの契約テストは`apps/api/src/features/{領域}/infra/commands/tests/`へ置く。APIの入口から複数の業務領域と実際の保存先を組み合わせるテストは`apps/api/src/tests/integration/`へ置き、必要な`layer.ts`を組み立てる。Workerの入口を含む公開境界全体を外側から検証するテストは`apps/api/src/tests/e2e/`へ置く。テストランナーの入口と初期化は`apps/api/testing/setup/`へ置き、テスト実行時の型宣言は`apps/api/testing/env.d.ts`へ置く。

権限制御、状態遷移、永続化、エラー処理の変更は、期待する挙動を表す失敗するテストを先に置く。仕様との対応は`describe`の題名に仕様IDを含めて示す。ファイル分割や命名変更だけなら、型チェック、リンター、既存の関連テストで参照先と挙動を確認し、ファイルごとにテストを増やさない。

### 応答の形

応答の形と組み立ては経路の隣(`routes/{経路}/{経路}.response.ts`)へ置く。応答はHTTPの契約であり、業務領域の知識ではない。

### 依存の向き

`shared`は`src/core`、`features`、`routes`、`plugins`を読まない。`core`は`features`を読まない。`domain`は自領域の`domain`と`core/domain`を参照する。`application`は自領域の`application/ports`、`application/facades`、`application/use-cases`、`domain`、`core/domain`を参照する。`application/ports/inbound`には領域が外部へ提供する契約を置き、`application/ports/outbound`には領域が外部の保存先や別領域へ要求する契約を置く。`adapters`は自領域の`outbound`ポートとドメイン、および相手領域の`public.ts`が公開する`inbound`ポートを参照し、`infra`を読まない。`infra`は自領域の`outbound`ポートとドメイン、および`core/domain`と`core/infra`を参照して、保存先を使う具象実装を提供する。

`public.ts`は自領域の契約と型を公開し、内部のコマンドやリポジトリなど永続化の詳細、`layer.ts`、テスト用コードを参照しない。`layer.ts`は自領域の`adapters`、`infra`、`application`、`domain`、`public.ts`を組み立て、他領域の`layer.ts`を参照しない。複数の表を一つの操作として更新する実装は、その操作を所有する領域の`infra/commands`へ置き、自領域の内部ポートとドメイン、および`core/infra`を参照する。`routes`は領域の`public.ts`、`core/domain`、`core/adapters`を参照し、テストファイルでは`testing/index.ts`を利用できる。

ユースケースは`Effect.Effect<成功値, エラー, 要求する依存>`を返す関数として書く。この型が契約であるため、ユースケースのインターフェースを別ファイルへ置かない。

ポートは`Context.Tag`で宣言し、実装は`Layer`として与える。`app.ts`が受け取るのはポートを解決した`ManagedRuntime`であり、`index.ts`だけが`Layer`から組み立てる。

この向きの主要な境界は`apps/api/oxlint.config.ts`の`no-restricted-imports`で検査する。`routes`、`application`、`domain`から`*.live`と`infra`配下の読み込みを禁止し、`adapters`から`infra`、`infra`から`adapters`と`application`の実装を読めないようにする。`shared`から`core`と上位の機能を、`core`から`features`の読み込みを禁止し、`routes`から領域の内側への読み込みを禁止する。`core`と`shared`の技術モジュールは公開入口からだけ読む。`features`全体へのoverrideで、領域名を含む読み込み先を公開面(`features/{領域}/public.ts`)と`testing`入口(`features/{領域}/testing`)に限り、`features`から`core/adapters`を読めないようにする。`public.ts`、`layer.ts`、本番コードから`tests`と`testing`を読めないようにし、テストコードからはテスト用の入口を読めるようにする。

### 型定義

| 対象                 | 書き方                                                       |
| -------------------- | ------------------------------------------------------------ |
| バリューオブジェクト | `Schema`に制約を付け、`Schema.brand`で他の型と混ざらなくする |
| 列挙                 | `Schema.Literal`                                             |
| エンティティ         | `Schema.Class`                                               |
| エラー               | `Data.TaggedError`                                           |
| 値のない状態         | `Option`                                                     |

TypeScriptの`enum`は使わない。`tsconfig.base.json`の`erasableSyntaxOnly`が実行時の構文を持つ記法を禁じており、パラメータプロパティ(`constructor(private readonly x)`)も同じ理由で使えない。

### エラー処理

保存先への操作そのものの失敗は`PersistenceError`で表し、在庫不足のような業務上の失敗は各領域のエラーとして表す。両者を型で分けるのは、業務エラーは担当者へ対処できる形で伝える必要があり、保存先の失敗は伝えても対処できないためである。

ルートハンドラは`Effect.Effect<A, never, R>`だけを実行できる。担当者が対処できる失敗は、応答として何を返すかをルートが決める。

対処できない失敗は`logAndDie`へ渡す。この関数は原因を記録へ残したうえで、内部情報を持たないdefectへ差し替える。Elysiaは処理されなかった例外の`message`を応答本文へそのまま出すため、元の失敗をそのままdefectにすると操作名と保存先の例外が来場者の画面へ現れる。

エラーを記録へ直接渡さないのも同じ理由による。D1の例外は列挙可能な属性を持たないため、JSONとして直列化すると空のオブジェクトになり原因が失われる。`message`を明示的に読んで文字列として記録する。

### HTTPの境界

ルートの検証はEffect Schemaで書き、`Schema.standardSchemaV1`でElysiaへ渡す。Elysia 1.4はStandard Schemaに対応しており、TypeBoxと同じように型推論が働く。

公開する型にブランドを出さない。画面は`@nekomimi/api`から`app.ts`の型を読むため、ブランドを出すと画面側も`effect`を型依存として持つことになる。`Schema.Literal`による列挙はブランドを持たないためそのまま公開する。ブランド付きのバリューオブジェクトへの変換は`application`層で行う。

各エンドポイントの`detail`に一意な`operationId`、操作を要約する`summary`、分類用の`tags`を付ける。権限や更新条件など、型だけでは伝わらない利用条件は`description`へ書く。入力・応答の意味はスキーマの注釈で補い、実装が返す成功・失敗の応答と揃える。API全体の情報とタグの説明は`app.ts`で管理する。

### 権限を伴う更新

画面の操作制限とルートの権限確認に加え、ユースケースでも実行者と対象者の条件を確認する。ロールのように変更自体が権限へ影響する値は、変更前と変更後の両方を判定する。具体的な許可範囲は[ロール管理の仕様](../../specs/system-wide.md#spec-sys-008-ロールを付与剥奪する)に従う。

確認と保存の間に権限や対象の状態が変わり得るため、保存時にも必要な条件を更新条件へ含める。`StaffRepository.updateRole`は、実行者の現在の権限、保護対象、変更前後のロールを一つの更新文で確認する。条件を満たさず更新されなかった場合は成功を返さない。

許可される変更と拒否される変更の双方に加え、確認後の権限剥奪や対象者の昇格でも不正な保存が成立しないことを検証する。権限仕様を変更するときは、API、保存処理、画面の操作制限、関連テスト、要件・仕様を同じ許可範囲へ揃える。

## 理由

Effectを使うのは、エラーと依存を関数の型に載せるためである。注文確定は在庫不足、在庫の記録なし、保存先の失敗が同時に起こりうる。返り値が`Promise<Order>`であれば、どの失敗を扱い忘れているかを型から読めない。`Effect<Order, OutOfStock | PersistenceError, OrderConfirmationCommand | OrderPricingGateway | OrderRepository | OrderStockAvailabilityGateway>`であれば、扱っていない失敗と依存が型検査で残る。ポートの役割を名前へ含めることで、この依存型と利用箇所だけから、領域の公開入口、他領域への要求、永続化を区別できる。

安定版の3.22系を使う。4.0系は`Schema`が書き直されており、この文書の時点でリリース候補である。出店日までの期間で、未安定の版へ追随する余地はない。

業務領域で縦割りにするのは、一つの業務の変更で読む範囲を一箇所へ収めるためである。層で縦割りにすると、在庫の仕様を一つ変えるために表定義、保存処理、業務処理、応答の4箇所を別々のディレクトリで探すことになる。仕様が[業務領域ごと](../../documentation-management.md)にまとまっているため、実装も同じ切り方にすると仕様と実装を対応させて読める。

ユースケースのインターフェースを別ファイルへ置かないのは、`Effect`の型が成功値、エラー、依存のすべてを表すためである。同じ内容をインターフェースとして再宣言すると、実装を変えるたびに二箇所を直すことになり、ずれても検出できない。

`app.ts`が`ManagedRuntime`だけを受け取るのは、画面が読む型にD1とDrizzleの型定義を漏らさないためである。`app.ts`が保存先の実装を参照すると、画面側の型検査にWorkers固有の型定義が必要になる([`DEC-SYS-004`](DEC-SYS-004-development-environment.md))。ポートの型は公開面の契約と領域の値だけで構成されるため、保存先の実装を各領域の`infra`へ置き、`src/index.ts`で`Layer`を解決することでこの境界を保てる。

Repositoryは、保存先の形式をドメインモデルへ変換する役割だけを見ればアダプターである。しかし、現在の具象実装はDrizzleの問い合わせAPIと表定義へ直接依存しており、これらをInterface Adaptersより外側のFrameworks & Driversに分類すると、アダプターから外側へのソースコード依存が生じる。Drizzleの問い合わせ能力を技術非依存の契約として再定義すると、ORMの抽象を複製するか、Repositoryポートとほぼ同じ契約を追加することになる。この分離に独立した変更理由がないため、Drizzleを使うRepositoryとコマンドの具象実装全体を`infra`に置く。

境界の検証をEffect Schemaに寄せるのは、検証の書き方を一系統に保つためである。TypeBoxを境界に残すと、同じ制約を境界とドメインの二箇所へ書くことになる。

在庫不足を`CHECK`制約として現すのは、D1に対話型のトランザクションがないためである。読み取った値を判断してから書き込む代わりに、注文の保存と在庫の減算をひとつのバッチとして実行し、制約違反で全体を取り消す([`DEC-SYS-003`](DEC-SYS-003-technology-stack.md))。

表定義を業務領域へ分けないのは、外部キーが領域をまたぐためである。在庫は商品を参照し、注文明細も商品を参照する。領域ごとに置くと表定義どうしが領域を越えて参照し合い、`core`が全表を集約する側でありながら`features`を読むことになって依存の向きが逆転する。表は業務の知識ではなく保存の形であり、`core/infra`に属する。

`domain`のファイルを概念で切るのは、一つの概念を理解するために複数のファイルを開かせないためである。エンティティ、そのエンティティだけが使うバリューオブジェクト、業務判定を種類ごとに分けると、「在庫とは何か」を読むだけで3つのディレクトリを行き来する。バレルを作らないのは、`import`文だけで型の出どころが分かる状態を保つためである。

## 影響

- 圧縮後のWorkerの大きさが約159キロバイトから約387キロバイトになる。無料枠の上限は圧縮後3メガバイトであり、収まっている。
- 新しい表を追加する場所は`src/core/infra/drizzle/schema.ts`だけである。
- テストでは`main`をテスト専用の入口へ差し替える。Elysiaの事前コンパイルはWorkerの起動時にしか行えず、本番の入口をテストランナー内で読み込むと拒否される。
- `no-underscore-dangle`は`_tag`を許可する。Effectのタグ付きエラーはこの名前で種類を判別する。
- 新しい業務領域を追加する手順は、`domain`、必要な`application/ports/inbound`と`application/ports/outbound`、`application/use-cases`、他領域と接続する`adapters`、保存先を使う`infra`、`public.ts`、`layer.ts`を作り、`apps/api/oxlint.config.ts`の業務領域パターンへ領域を加え、`src/index.ts`の`Layer.mergeAll`へ加えることである。複数の表を一つの状態変更として保存する場合は、その操作を所有する領域の`infra/commands`に実装と契約テストを置く。
