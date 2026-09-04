---
schema: decision
id: DEC-SYS-005
title: APIの内部構造とエラー処理
domain: SYS
requirements:
  - REQ-INV-003
  - REQ-SYS-002
evidence: []
---

# DEC-SYS-005 APIの内部構造とエラー処理

## 結論

APIの内部を業務領域で縦割りにし、領域の中を層で分ける。エラー処理、型定義、依存の解決はEffect(`effect`、3.22系)で行う。

```
apps/api/src/
├── core/            複数領域が共有するもの
│   ├── domain/      共有する識別子、金額、保存先の失敗を表す型
│   ├── infra/       D1とDrizzleの実体、全表の定義
│   └── adapters/    Effectをルートハンドラへ繋ぐ処理
├── features/        業務領域ごと(inventory、visitor-information、…)
│   └── {領域}/
│       ├── domain/       概念ごとに1ファイル(stock.ts、menu-item.ts、…)
│       ├── application/  ports(依存の宣言)、use-cases(業務処理)
│       ├── adapters/     repositories(保存先の実装)
│       ├── testing/      fixtures、mocks。入口は`testing/index.ts`
│       ├── index.ts      この領域の公開面
│       └── layer.ts      この領域の実装を組み立てる
├── routes/
│   └── {経路}/
│       ├── {経路}.route.ts     経路の定義
│       ├── {経路}.response.ts  応答の形と組み立て
│       └── tests/
├── app.ts           経路の合成。画面が読む型の正本
└── index.ts         Workerの入口。実装の解決はここだけで行う
```

領域の名前は[ドキュメント管理](../../documentation-management.md)の業務領域に合わせる。

### 表定義

すべての表を`core/infra/drizzle/schema.ts`に置く。業務領域ごとに分けない。

### ファイルの切り方

`domain`のファイルは種類ではなく概念で切る。エンティティ、そのエンティティだけが使うバリューオブジェクト、業務判定の関数を同じファイルへ入れる。バリューオブジェクトを独立したファイルへ出すのは、同じ領域の2つ以上のエンティティが使うときだけである。2つ以上の領域が使うものは`core/domain`へ置く。

領域の内側にバレルを作らない。

### 領域の公開面

領域の外から読めるのは`features/{領域}/index.ts`だけである。ここへ載せるのはポート、ドメインの型と判定関数、ユースケースである。

`layer.ts`は公開面へ載せない。`layer.ts`は保存先の実装を読むため、公開面へ載せるとルートとユースケースから実装へ到達でき、`app.ts`の型にD1とDrizzleの型定義が漏れる。`layer.ts`を読むのは`src/index.ts`だけである。

テスト用の`fixtures`と`mocks`は`features/{領域}/testing/index.ts`を入口とする。

### 応答の形

応答の形と組み立ては経路の隣(`routes/{経路}/{経路}.response.ts`)へ置く。応答はHTTPの契約であり、業務領域の知識ではない。

### 依存の向き

`core`は`features`を読まない。`domain`は何にも依存しない。`application`は`domain`と`core/domain`だけに依存する。`adapters`は`application`が宣言したポートを実装し、`core/infra`を読む。

ユースケースは`Effect.Effect<成功値, エラー, 要求する依存>`を返す関数として書く。この型が契約であるため、ユースケースのインターフェースを別ファイルへ置かない。

ポートは`Context.Tag`で宣言し、実装は`Layer`として与える。`app.ts`が受け取るのはポートを解決した`ManagedRuntime`であり、`index.ts`だけが`Layer`から組み立てる。

この向きは`.oxlintrc.jsonc`の`no-restricted-imports`で検査する。`routes`、`application`、`domain`から`*.live`と`infra`配下の読み込みを禁止し、`core`から`features`の読み込みを禁止し、`routes`から領域の内側への読み込みを禁止する。領域ごとのoverrideで他領域の`domain`、`application`、`adapters`、`layer.ts`の読み込みを禁止し、`features`から`core/adapters`を読めないようにする。

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

## 理由

Effectを使うのは、エラーと依存を関数の型に載せるためである。注文確定は在庫不足、在庫の記録なし、保存先の失敗が同時に起こりうる。返り値が`Promise<Order>`であれば、どの失敗を扱い忘れているかを型から読めない。`Effect<Order, OutOfStock | PersistenceError, StockRepository>`であれば、扱っていない失敗が型検査で残る。

安定版の3.22系を使う。4.0系は`Schema`が書き直されており、この文書の時点でリリース候補である。出店日までの期間で、未安定の版へ追随する余地はない。

業務領域で縦割りにするのは、一つの業務の変更で読む範囲を一箇所へ収めるためである。層で縦割りにすると、在庫の仕様を一つ変えるために表定義、保存処理、業務処理、応答の4箇所を別々のディレクトリで探すことになる。仕様が[業務領域ごと](../../documentation-management.md)にまとまっているため、実装も同じ切り方にすると仕様と実装を対応させて読める。

ユースケースのインターフェースを別ファイルへ置かないのは、`Effect`の型が成功値、エラー、依存のすべてを表すためである。同じ内容をインターフェースとして再宣言すると、実装を変えるたびに二箇所を直すことになり、ずれても検出できない。

`app.ts`が`ManagedRuntime`だけを受け取るのは、画面が読む型にD1とDrizzleの型定義を漏らさないためである。`app.ts`が保存先の実装を参照すると、画面側の型検査にWorkers固有の型定義が必要になる([`DEC-SYS-004`](DEC-SYS-004-development-environment.md))。ポートの型はこの領域の値だけで構成されるため、実装を`index.ts`へ寄せることでこの境界を保てる。

境界の検証をEffect Schemaに寄せるのは、検証の書き方を一系統に保つためである。TypeBoxを境界に残すと、同じ制約を境界とドメインの二箇所へ書くことになる。

在庫不足を`CHECK`制約として現すのは、D1に対話型のトランザクションがないためである。読み取った値を判断してから書き込む代わりに、注文の保存と在庫の減算をひとつのバッチとして実行し、制約違反で全体を取り消す([`DEC-SYS-003`](DEC-SYS-003-technology-stack.md))。

表定義を業務領域へ分けないのは、外部キーが領域をまたぐためである。在庫は商品を参照し、注文明細も商品を参照する。領域ごとに置くと表定義どうしが領域を越えて参照し合い、`core`が全表を集約する側でありながら`features`を読むことになって依存の向きが逆転する。表は業務の知識ではなく保存の形であり、`core/infra`に属する。

`domain`のファイルを概念で切るのは、一つの概念を理解するために複数のファイルを開かせないためである。エンティティ、そのエンティティだけが使うバリューオブジェクト、業務判定を種類ごとに分けると、「在庫とは何か」を読むだけで3つのディレクトリを行き来する。バレルを作らないのは、`import`文だけで型の出どころが分かる状態を保つためである。

## 影響

- 圧縮後のWorkerの大きさが約159キロバイトから約387キロバイトになる。無料枠の上限は圧縮後3メガバイトであり、収まっている。
- 新しい表を追加する場所は`src/core/infra/drizzle/schema.ts`だけである。
- テストでは`main`をテスト専用の入口へ差し替える。Elysiaの事前コンパイルはWorkerの起動時にしか行えず、本番の入口をテストランナー内で読み込むと拒否される。
- `no-underscore-dangle`は`_tag`を許可する。Effectのタグ付きエラーはこの名前で種類を判別する。
- 新しい業務領域を追加する手順は、`domain`、`application/ports`、`application/use-cases`、`adapters`、`layer.ts`を作り、`.oxlintrc.jsonc`の業務領域パターンへ領域を加え、`index.ts`の`Layer.mergeAll`へ加えることである。
