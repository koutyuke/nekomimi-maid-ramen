---
schema: decision
id: DEC-SYS-006
title: 画面の内部構造と状態管理
domain: SYS
requirements:
  - REQ-VIS-002
  - REQ-VIS-004
  - REQ-SAL-001
  - REQ-SYS-008
evidence: []
---

# DEC-SYS-006 画面の内部構造と状態管理

## 結論

スタッフ画面の内部をFeature-Sliced Design(FSD)の層で分け、層の中を業務領域(スライス)で切る。独立した表示検証や変更に価値がある箇所でPresenterとContainerを分ける。通常のページは接続済み部品を直接組み合わせ、全階層での二分を要求しない。サーバーから取得する状態はTanStack Query(`@tanstack/react-query`、5系)、画面をまたいで保持するクライアント状態はJotai(`jotai`、2系)で扱う。

公開側もFSDの依存方向を使うが、現在必要な`app`、`pages`、`features`、`shared`だけを置く。Astroが経路として要求する`src/pages`は、`layers/app`のレイアウトと`layers/pages`の画面を結線するだけにする。`app` → `pages` → `features` → `shared`の順で下位の層だけを読み、スライスの外からは`index.ts`を経由する。この境界は`apps/site/oxlint.config.ts`で検査する。

Astro部品では、表示だけを担う`.ui.astro`をPresenter、副作用と結線を担う`.astro`をContainerとする。ブラウザーで取得後に変わる表示は、DOMへ状態を反映する`*.view.ts`をPresenter、API取得と再試行を制御する`model`をContainerとして分ける。副作用のないトップ画面にはContainerを作らない。

公開トップと見出しは静的HTMLとして生成し、現在の販売可否はブラウザーから公開APIへ問い合わせる。取得中・失敗・商品なしを区別し、失敗時は商品一覧を消す。テーマは`SPEC-VIS-005`に従い、`site-theme`キーで保存する。端末設定への追従はCSSの`color-scheme`を使う。

公開側のStorybookは`@storybook-astro/framework`でAstro部品を描画し、アプリと同じCSSを読み込む。ストーリーは部品の隣に`{部品}.stories.ts`として置く。静的ビルドではAstroのpropsが事前描画されるため、Controlsによる変更は開発サーバーで確認する。

Astroを採用するのは、静的な情報提供と独自デザインをスタッフ側のProviderやMantineから分離できるためである。Astro 7.3.2で、見出しを含む静的HTMLとブラウザーからAPIを取得するスクリプトを小規模にビルドできることを確認した。Reactのアイランドは現在のメニュー取得とテーマ切り替えには不要で、標準のDOM操作で足りる。APIクライアントは既存のEden Treatyを利用し、描画時はAPIの文字列をHTMLとして解釈しない。

公開側とスタッフ側のUI・スタイル・Providerは共有しない。`packages/core`ではURLと、APIと公開側が使うメニューの分類値・分類型を共有する。

`MenuItem`は各アプリの利用項目に合わせて定義する。スタッフ側は`entities/menu/model`で注文入力に使う項目と在庫残数を持ち、公開側は`pages/menu/model`で商品説明・分類・特定原材料を含む表示用の型を持つ。特定原材料の型と分類の表示名も公開側が所有する。API取得関数の戻り値を各アプリの型へ合わせ、応答との整合性を型検査で確認する。

`@nekomimi/api`が画面へ公開するのは`App`型だけとする。画面からの参照は各アプリの`no-restricted-imports`で検査する。HTTP応答はEden Treatyを通じて参照し、スタッフ側のキャッシュ形式`Snapshot`と通知の対象範囲`ResourceScope`は`shared/api`が所有する。

参考: [Astroのスクリプト処理](https://docs.astro.build/en/guides/client-side-scripts/)、[Cloudflareへの配備](https://docs.astro.build/en/guides/deploy/cloudflare/)。

```
apps/site/
├── src/
│   ├── pages/          Astroの経路。レイアウトと画面の結線だけを行う
│   └── layers/
│       ├── app/        共通レイアウト、ヘッダー、スタイル
│       ├── pages/      画面ごとのスライス
│       ├── features/   利用者の操作と副作用を伴う機能
│       └── shared/     APIクライアントなど領域に属さない基盤
└── .storybook/
```

空の層は作らない。複数画面で共有する業務概念が生じた場合に`entities`、複数の機能を組み合わせる独立した区画が生じた場合に`widgets`を追加する。

```
apps/staff/
├── src/
│   ├── layers/
│   │   ├── app/            アプリ全体の初期化
│   │   │   ├── providers/  Provider の組み立て
│   │   │   ├── store/      QueryClient などの実体
│   │   │   └── styles/     Mantine のテーマ
│   │   ├── pages/          画面ごとのスライス
│   │   │   └── {画面}/
│   │   │       ├── ui/{部品}/{部品}.tsx     Container
│   │   │       ├── ui/{部品}/{部品}.ui.tsx  Presenter
│   │   │       └── index.ts                 スライスの公開入口
│   │   ├── widgets/        複数の機能を組み合わせた区画
│   │   ├── features/       利用者の操作を伴う機能
│   │   ├── entities/       業務領域ごとのスライス
│   │   │   └── {領域}/
│   │   │       ├── api/      APIの呼び出しとQuery定義
│   │   │       ├── model/    画面が扱う型、atom
│   │   │       ├── lib/      型に対する純粋な導出
│   │   │       ├── ui/{部品}/  この領域の表示部品(Presenter)
│   │   │       ├── testing/  fixtures。入口は`testing/index.ts`
│   │   │       └── index.ts  スライスの公開入口
│   │   └── shared/         領域に属さない基盤(Edenのクライアントなど)
│   ├── routes/             TanStack Routerのファイル経路
│   ├── testing/            試験の描画補助と初期化
│   └── main.tsx            ブラウザの入口
└── .storybook/
```

業務モデルの名前は[ドキュメント管理](../../documentation-management.md)の業務領域に合わせる。`entities/orders`は注文を所有し、調理と受け渡しはその注文を扱う別のページとする。画面のスライスとAPIの機能を一対一には対応させない。

### 層とスライスの公開入口

`entities`、`features`、`widgets`、`pages`のスライスは`{層}/{スライス}/index.ts`を唯一の公開入口とする。他のスライスからは`entities/menu`のようにスライスを指定して読み込み、内部ファイルへ直接参照しない。層全体をまとめる`index.ts`は作らない。

`index.ts`へ載せるのは、スライスの外から実際に読むものだけである。外から読まないものは載せず、必要になった時点で追加する。スライスの中では、部品もfixtureも内部のファイルを相対パスで直接読む。

`shared`は基盤ごとに`shared/{基盤}/index.ts`を入口とする。HTTP・WebSocketの接続基盤は`shared/api`へ置き、各業務の要求と応答を扱う取得関数は所有するスライスの`api`へ置く。共通の補助関数は`shared/lib`、業務に依存しないエラー・読み込み中の表示は`shared/ui`へ置く。日本時間の日付を返す処理は`shared/lib/business-date.ts`に置く。`app`は`main.tsx`が`app/providers`を読み、試験の描画補助とStorybookが`app/styles`を読む。

fixtureは`{層}/{スライス}/testing/index.ts`を入口とし、StorybookとテストからPresenterへ渡す状態をここで作る。本番コードは`testing`を読まない。

### 業務モデルと表示部品

業務領域で共有する型と定数は`entities/{領域}/model`へ置く。スタッフの`Staff`、`StaffRole`、ロールの表示順は`entities/staff/model`が所有する。特定の操作だけに必要な制約は、その機能の型で表す。ロール管理の実行者をOwnerとAdminに限定する型は、`pages/staff-management`で定義する。

注文の`Order`はEden Treatyの応答から導出し、`OrderLine`と`CookingState`も同じ契約から取り出す。必要項目を限定する`OrderSummary`は`Pick`と`Readonly`で表す。APIと異なる画面固有の状態はページや機能が所有する型として定義し、応答と同じ型を画面名ごとに複製しない。

調理状態の更新APIと処理中の明細を管理するフックは`features/change-cooking-state`が所有する。調理・受け渡しページが共有する表示部品`CookingStateControlUI`も同じ機能へ置く。在庫管理専用のUIと更新APIは`pages/inventory-management`へ置き、同期機能を下位の`features/sync-data`から使う。

業務領域の意味を表す表示部品は`entities/{領域}/ui`へ置く。ロールの表示は`StaffRoleBadge`に集約し、利用側は`entities/staff`から直接読み込む。下位の表示部品を使うだけの場合は、`slots`へ渡す必要はない。

### PresenterとContainer

| 役割      | ファイル名      | 部品名     | 担うこと                                                |
| --------- | --------------- | ---------- | ------------------------------------------------------- |
| Presenter | `{部品}.ui.tsx` | `{部品}UI` | propsの表示、見た目、表示に閉じた状態                   |
| Container | `{部品}.tsx`    | `{部品}`   | データ取得、副作用、Presenterへ渡す値とハンドラーの用意 |

PresenterはAPI、保存領域、業務用の共有状態へ接続しない。開閉、入力途中の値、表示フィルターは`useState`で持ってよい。DOMのフォーカス移動など表示に閉じた副作用、純粋関数による業務上の導出も許す。Routerの`Link`・`useLocation`・`useMatchRoute`はリンクと現在位置の表示に使える。リンクや現在のパスを渡すためだけのContainerは作らない。API成功後や認証結果による遷移、業務データの取得条件を決めるための経路データはContainer・業務用フック・認証ガードが扱う。テーマや局所的なUIのContextとRouterの表示機能は表示環境として許可する。

Presenterは同じスライスまたは下位の層の表示部品を直接使える。`features`の公開部品でも、`CookingStateControlUI`のように通信や共有状態へ接続しなければ直接使ってよい。Containerを組み込む場合は、親Containerが`slots`または`children`として要素を渡す。操作は通常のイベントpropsを基本とし、意味のある操作群は`actions`へまとめてよい。主内容は`children`、複数の配置先は名前付きpropsを使う。`slots`への一律の集約は要求しない。

同じ対象を表すpropsは、対象ごとのオブジェクトにまとめる。たとえばロール管理の実行者は、IDとロールを別々に渡さず`currentStaff`として渡す。必要な項目だけを既存の型から選び、機能固有の制約を加える。

表示と表示内の状態だけで完結する部品には、Containerを作らない。外部接続があっても、独立した表示契約が不要な小さな機能は単一部品でよい。在庫管理ページはContainerへ取得・同期・更新処理を集約し、ページPresenterで取得状態と更新結果を表示する。一覧表と数量入力は`StockTableUI`、認証は共通の`AuthGuard`、アクセス許可は管理者レイアウトの`PermissionGuard`が担当する。スタッフ管理ページはContainerへ取得・更新処理を集約し、ページPresenterで取得状態と更新結果を表示する。一覧表とロール選択は`StaffTableUI`が担当する。通信や共有状態との接続を分離する場合、小さなContainerは直接`useQuery`や`useMutation`を呼んでよい。複数処理の協調や状態遷移がある場合にフックへ切り出し、純粋な計算は通常の関数にする。具体的な判断手順は[実装ガイド](../../../apps/staff/docs/presentational-container-pattern.md)に記載する。

### 部品の置き方

`ui`セグメントでは、部品ごとに`ui/{部品}/`のディレクトリを作る。Container(`{部品}.tsx`)、Presenter(`{部品}.ui.tsx`)、Presenterのテスト(`{部品}.ui.test.tsx`)、Storybook(`{部品}.stories.tsx`)を同じディレクトリへ置く。

Container・Presenter・テスト・ストーリーをまとめて持つ部品では、この置き方で関連ファイルを近接させる。小さな表示部品や`shared/ui`の共通表示は、一つのファイルに置いてよい。

部品ごとの`index.ts`は作らない。スライスの外へ出すものは`{層}/{スライス}/index.ts`だけで公開し、スライスの中では部品のファイルを相対パスで直接読む。

### スタッフのナビゲーションとアカウント操作

ナビゲーションの一覧とロール別の表示条件は`widgets/layout/model/navigation.ts`に置く。スタッフのトップは同じスライスの公開入口からナビゲーションを読み、アカウント欄とともに表示する。

アカウントカードは`entities/staff/ui`に置き、氏名・メールアドレス・ロールの表示を担当する。`widgets/layout`の`HamburgerMenu`がQueryから認証情報を読み、ログアウト操作を`HamburgerMenuUI`へ渡す。トップ本文は同じQueryキャッシュを参照し、アカウントカードとナビゲーションを表示する。ログアウトの処理中・失敗状態はContainerの`HamburgerMenu`が保持し、メニューの開閉や画面移動で失われない。ログアウト成功時は通信を取り消し、認証キャッシュを未ログインへ更新し、その他のキャッシュを削除してセッションを再確認する。

`app/layout`の`AuthenticatedLayout`がHeader・本文・Footerを組み合わせ、固定ヘッダーと本文の余白を扱う。`HeaderUI`はロゴとメニューの配置、`HamburgerMenuUI`はアバターの表示とDrawerの開閉、`AccountMenuUI`はアカウント情報・ナビゲーション・ログアウトボタンの表示を担当する。認証情報の取得失敗や未ログインへの変化でメニューを閉じ、復旧後も閉じた状態を保つ。ナビゲーションのPresenterは渡されたロールに応じたリンクを表示し、Routerから現在位置を読む。

### 状態の置き場

| 状態                               | 置き場                           |
| ---------------------------------- | -------------------------------- |
| APIから取得する状態                | `entities/{領域}/api`のQuery定義 |
| 画面をまたいで保持する入力・選択   | `entities/{領域}/model`のatom    |
| 表示に閉じた状態                   | Presenterの`useState`            |
| 画面の業務処理と一緒に保持する入力 | ページや機能の`model`のフック    |

`QueryClient`は`app/store`に置き、`app/providers`が渡す。入力の所有者は必要な寿命で決める。部品を移動・抽出するときは、`key`、マウント条件、初期値の適用タイミングを維持する。

### Query定義

Query定義は、そのデータを所有する業務領域の`entities/{領域}/api/{領域}.query.ts`へ置く。このファイルは、複数のQueryへ前方一致させる範囲キーを`{領域}QueryScopes`、`queryOptions`を返す関数を`{領域}Queries`として公開する。クエリが一本だけの領域でも同じ形にする。

```ts
export const menuQueryScopes = {
  all: () => ["menu"] as const,
  lists: () => [...menuQueryScopes.all(), "list"] as const,
};

export const menuQueries = {
  list: () => queryOptions({ queryKey: menuQueryScopes.lists(), queryFn: ({ signal }) => getMenu(signal) }),
};
```

`{領域}QueryScopes`の関数は範囲キーだけを返し、`{領域}Queries`の関数は`queryOptions`だけを返す。キーと`queryOptions`を同じオブジェクトへ混ぜない。

`queryFn`へ渡す取得処理は`entities/{領域}/api/{操作}-{対象}.ts`へ分けて置く。応答をこのアプリが扱う型へ変換し、失敗を投げるところまでをこの関数が担う。API操作は公開関数ごとにファイルを分け、一覧取得とリビジョン取得を同居させない。その操作専用の非公開ヘルパーと型は同居してよい。Query定義は同じ領域の`api`へ置く。注文管理・調理・受け渡しの定義は`entities/orders/api`が所有し、取得条件と無効化の範囲に対応する`orders`・`kitchen`・`handoff`のキャッシュを個別に管理する。

キャッシュキーをQuery定義の外へ書かない。複数のQueryをまとめて操作するときは`{領域}QueryScopes`を指定し、特定のQueryだけを操作するときは`{領域}Queries.{対象}(...).queryKey`を指定する。

複数の業務領域をまたぐ、画面固有のQuery定義は、その画面の`pages/{画面}/api`または機能の`features/{領域}/api`へ置く。所有者が一つに決まらないものを`entities`へ入れない。更新APIは操作を所有するページや機能の`api`へ置き、再取得する範囲やエラー表示の方針はContainerまたはそのフックで決める。`useQuery(options)`を呼ぶだけの専用フックは作らない。

スタッフ向けの一覧はデータとリビジョンを組にしてキャッシュし、`select`で表示用のデータを取り出す。`features/sync-data/model/use-realtime.ts`が同期状態・認可拒否とQueryの連携を管理し、`shared/api/subscribe-updates.ts`が通知接続・定期照合・再接続を扱う。照合APIの呼び出しは各`entities`が所有し、共通処理へ関数として渡す。同期のために再取得しても、画面内の注文候補や預かり金を初期化しない。

### 経路

`src/routes/`はTanStack Routerのファイル経路であり、`pages`の画面と`app/layout`の認証境界を結線する。経路ファイルへ部品の見た目とデータ取得を書かない。経路一覧(`src/routeTree.gen.ts`)は生成物であり、直接編集しない。HeaderとFooterは認証状態によらず表示し、本文だけを共通の`AuthGuard`で囲む。Header内のメニューは`useQuery`で取得状態に応じた表示を選ぶ。本文の認証確認はSuspense、通信エラーと再試行は認証用のエラー境界が担当する。再試行を一か所に集約し、認証情報の再取得とエラー境界の解除を同じ操作で行う。トップは未認証時にログインを案内し、他の経路は未認証なら`/`へ戻す。本文側の`PermissionGuard`が各ページに必要なロールを判定する。権限不足でも共通レイアウトを残し、ページ移動とログアウトを利用できる。APIも各要求で権限を検証する。

### 試験とStorybook

StorybookではPresenterの表示と操作を確認する。propsと表示内の状態を使い、実際のAPIへ接続せずに判断の分かれる表示を再現する。下位の表示部品は実物を使い、Container用のスロットは表示用の要素で置き換える。共通デコレーターでMantineとメモリー履歴のRouterを用意する。初期パスは`parameters.routerPath`で指定し、リンク選択で現在位置が変わることも確認する。本番の経路・ローダー・事前読み込みは使わない。Queryなどを含む本番の接続は結合テストまたは結合ストーリーで確認する。

テストはPresenterだけに限定せず、純粋関数の業務規則と、フックやContainerの権限判定、重複送信、競合、再試行も確認する。

Storybookのファイル名は`{部品}.stories.tsx`、Presenterのテストのファイル名は`{部品}.ui.test.tsx`とし、対象の隣へ置く。

### 依存の向き

`app`から`shared`へ向かう一方向だけを許す。`app` → `pages` → `widgets` → `features` → `entities` → `shared`の順であり、下位の層は上位の層を読まない。同じ層の別スライスも参照しない。`app`と`shared`はスライスを持たない。`routes`は`pages`と共通レイアウトの公開入口を読む。

上位層への参照と公開入口の迂回は`apps/staff/oxlint.config.ts`の`no-restricted-imports`、同層の別スライスへの相対参照は`staff-fsd/no-cross-slice-imports`で検査する。Presenterの依存先を一律に制限するカスタムルールは設けず、表示と業務処理の境界はコードレビューと挙動テストで確認する。

同層の参照規則は、静的なimport、再公開、文字列を指定した動的importを対象とする。

## 理由

層とスライスの二段で切るのは、画面の追加で読む範囲を一箇所へ収めるためである。層だけで切ると、メニュー表示の型、取得、表示部品が別々のディレクトリへ散る。スライスだけで切ると、複数画面が使う部品の置き場が決まらない。APIも業務領域で縦割りにしているため([`DEC-SYS-005`](DEC-SYS-005-api-internal-structure.md))、共通の業務モデルを同じ領域名で切ると仕様と実装を対応させて読める。

PresenterとContainerを分けるのは、表示の分岐を実際の通信なしで確認できるようにするためである。売り切れ、特定原材料の未確認、取得失敗のように、業務上重要な分岐は表示側にある。Presenterがデータ取得を持つと、これらを確認するたびにAPIの応答か通信の失敗を用意することになる。通信から切り離せば、fixtureと表示内の操作で確認できる。

Presenterへ上位の層を読ませないのは、部品の再利用先を型で保つためである。Presenterが上位の部品を直接読むと、その部品が使う場所ごとに読み込み先が増え、下位の部品が上位の構成へ依存する。要素を`slots`で受け取れば、差し込む側だけが構成を知る。

部品ごとにディレクトリを作るのは、PresenterとContainerへ分けた結果、一つの部品が実装、表示、テスト、Storybookの4ファイルになるためである。ファイルの種類で並べると、同じ部品に属するファイルが`ui`の直下へ散る。ディレクトリを部品の境界として使えば、部品を一つ読むために開く範囲がそのディレクトリに収まる。FSDは層・スライス・セグメントの構造と依存の向きを定めるが、個々の部品のファイル配置までは定めないため、この置き方を自分たちで決める必要がある。

サーバー状態とクライアント状態を別の道具で扱うのは、必要な操作が異なるためである。在庫と販売可否は他の担当者の操作で変わるため、取得中、失敗、再取得、キャッシュの無効化が必要になる。注文候補の商品と個数は画面の中だけで完結し、これらの操作を必要としない。両方を同じ道具で持つと、片方には不要な状態を常に扱うことになる。

TanStack Queryを画面側に置くのは、注文確定後に在庫と販売可否を取り直す経路が必要になるためである。確定はサーバーの状態を変えるため、変更後に同じキーのキャッシュを無効化して再取得する。この結線を各画面へ手で書くと、画面ごとに再取得の抜けが生じる。

Query定義を`api`へ置くのは、`queryOptions`がサーバーへの要求とキャッシュキーの記述であり、画面が保持する状態ではないためである。`model`には業務領域の型・定数と、Jotaiのatomのように画面が持つ状態を置く。Query定義をそれを所有する業務領域のスライスへ置くのは、キャッシュキーとその構造を、データを所有する場所と同じ場所で決めるためである。キーを利用側へ書くと、無効化の対象を画面ごとに推測することになる。

クエリが一本だけの領域でも`{領域}Queries`のオブジェクトにするのは、置き方をクエリの本数で変えないためである。本数を条件にすると、二本目を追加するときに書き換えが必要になり、いつ切り替えるかの判断が毎回発生する。

範囲キーを`{領域}QueryScopes`へ分けるのは、`{領域}Queries`の関数が返すものを`queryOptions`だけに揃えるためである。同じオブジェクトへキーを返す関数を混ぜると、`menuQueries.all()`と`menuQueries.list()`のように呼び出しの形が同じで返すものが違い、定義を開くまで区別できない。範囲キーとQueryの名前を分ければ、複数のQueryへ前方一致させる操作と、特定のQueryを扱う操作を利用箇所で読み分けられる。特定のQueryのキーは`queryOptions`に含まれるため、別のキーファクトリーへ重複して定義しない。

`index.ts`へ外から読むものだけを載せるのは、スライスの内側を変えたときに影響範囲を公開面から読めるようにするためである。使われていないものを公開すると、利用箇所を調べずに内側を変えられなくなる。

StorybookをPresenterへ向けるのは、表示と操作の確認を通信条件から切り離すためである。Containerの通信や状態遷移は挙動テストで確認する。

## 影響

- 新しい画面を追加する手順は、必要な型とAPI呼び出しを`entities/{領域}`へ置き、`pages/{画面}/ui/`へ画面を作り、独立した表示契約が必要ならPresenterを抽出し、`src/routes/`へ経路を追加して`pages`の部品を貼ることである。
- 新しいスライスを追加する場合は`index.ts`を作り、そのスライスの外へ出すものだけを載せる。
- 表示の分岐を追加した場合は、Presenterのテストとfixtureを同じ変更で更新する。
- 経路を追加すると`src/routeTree.gen.ts`が再生成される。生成は`vite`の実行時に行われるため、経路の追加後は`pnpm staff build`または`pnpm staff dev`を通す。
- 試験は`src/testing/setup.ts`で描画結果を毎回破棄する。一つのファイルで複数回描画するため、破棄しないと前の描画が残って要素の取得が二重になる。
