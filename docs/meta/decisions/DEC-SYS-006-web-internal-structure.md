---
schema: decision
id: DEC-SYS-006
title: 画面の内部構造と状態管理
domain: SYS
requirements:
  - REQ-VIS-002
  - REQ-VIS-004
  - REQ-SAL-001
evidence: []
---

# DEC-SYS-006 画面の内部構造と状態管理

## 結論

画面の内部をFeature-Sliced Design(FSD)の層で分け、層の中を業務領域(スライス)で切る。部品は表示だけを担うPresenterと、副作用と結線を担うContainerへ分ける。サーバーから取得する状態はTanStack Query(`@tanstack/react-query`、5系)、画面をまたいで保持するクライアント状態はJotai(`jotai`、2系)で扱う。

```
apps/web/
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

領域の名前は[ドキュメント管理](../../documentation-management.md)の業務領域に合わせ、APIの`features/{領域}`と同じ名前を使う。

### 層とスライスの公開入口

`entities`、`features`、`widgets`、`pages`のスライスは`{層}/{スライス}/index.ts`を唯一の公開入口とする。他のスライスからは`entities/menu`のようにスライスを指定して読み込み、内部ファイルへ直接参照しない。層全体をまとめる`index.ts`は作らない。

`index.ts`へ載せるのは、スライスの外から実際に読むものだけである。外から読まないものは載せず、必要になった時点で追加する。スライスの中では、部品もfixtureも内部のファイルを相対パスで直接読む。

`shared`は基盤ごとに`shared/{基盤}/index.ts`を入口とする。`app`は`main.tsx`が`app/providers`を読み、試験の描画補助とStorybookが`app/styles`を読む。

fixtureは`{層}/{スライス}/testing/index.ts`を入口とし、StorybookとテストからPresenterへ渡す状態をここで作る。本番コードは`testing`を読まない。

### PresenterとContainer

| 役割      | ファイル名      | 部品名     | 担うこと                                                |
| --------- | --------------- | ---------- | ------------------------------------------------------- |
| Presenter | `{部品}.ui.tsx` | `{部品}UI` | propsの表示、見た目、表示に閉じた状態                   |
| Container | `{部品}.tsx`    | `{部品}`   | データ取得、副作用、Presenterへ渡す値とハンドラーの用意 |

Presenterは純粋な部品として書く。API呼び出し、経路の操作、保存領域の読み書き、グローバル状態の参照は行わない。開閉、入力途中の値、hoverのように表示に閉じた状態は`useState`で持ってよい。

Presenterは自分より上位の層と、他のスライスのContainerを読まない。上位の部品を差し込む場合はContainerが`slots`として要素を渡し、操作は`actions.on*`として渡す。

副作用も分岐するロジックも持たない部品は、Presenterだけを置いてContainerを作らない。データ取得か外部への副作用が入った時点で分ける。

### 部品の置き方

`ui`セグメントでは、部品ごとに`ui/{部品}/`のディレクトリを作る。Container(`{部品}.tsx`)、Presenter(`{部品}.ui.tsx`)、Presenterのテスト(`{部品}.ui.test.tsx`)、Storybook(`{部品}.stories.tsx`)を同じディレクトリへ置く。

この置き方は、層とスライス内の部品の数によって変えない。

部品ごとの`index.ts`は作らない。スライスの外へ出すものは`{層}/{スライス}/index.ts`だけで公開し、スライスの中では部品のファイルを相対パスで直接読む。

### 状態の置き場

| 状態                             | 置き場                           |
| -------------------------------- | -------------------------------- |
| APIから取得する状態              | `entities/{領域}/api`のQuery定義 |
| 画面をまたいで保持する入力・選択 | `entities/{領域}/model`のatom    |
| 表示に閉じた状態                 | Presenterの`useState`            |

`QueryClient`は`app/store`に置き、`app/providers`が渡す。

### Query定義

Query定義は、そのデータを所有する業務領域の`entities/{領域}/api/{領域}.query.ts`へ置く。このファイルは、複数のQueryへ前方一致させる範囲キーを`{領域}QueryScopes`、`queryOptions`を返す関数を`{領域}Queries`として公開する。クエリが一本だけの領域でも同じ形にする。

```ts
export const menuQueryScopes = {
  all: () => ["menu"] as const,
  lists: () => [...menuQueryScopes.all(), "list"] as const,
};

export const menuQueries = {
  list: () => queryOptions({ queryKey: menuQueryScopes.lists(), queryFn: getMenu }),
};
```

`{領域}QueryScopes`の関数は範囲キーだけを返し、`{領域}Queries`の関数は`queryOptions`だけを返す。キーと`queryOptions`を同じオブジェクトへ混ぜない。

`queryFn`へ渡す取得処理は`entities/{領域}/api/{操作}-{対象}.ts`へ分けて置く。応答をこのアプリが扱う型へ変換し、失敗を投げるところまでをこの関数が担う。

キャッシュキーをQuery定義の外へ書かない。複数のQueryをまとめて操作するときは`{領域}QueryScopes`を指定し、特定のQueryだけを操作するときは`{領域}Queries.{対象}(...).queryKey`を指定する。

複数の業務領域をまたぐ、画面固有のQuery定義は、その画面の`pages/{画面}/api`または機能の`features/{領域}/api`へ置く。所有者が一つに決まらないものを`entities`へ入れない。

### 経路

`src/routes/`はTanStack Routerのファイル経路であり、`pages`の部品を貼るだけにする。経路ファイルへ部品の見た目とデータ取得を書かない。経路一覧(`src/routeTree.gen.ts`)は生成物であり、直接編集しない。

### 試験とStorybook

テストとStorybookはPresenterを対象にする。Presenterはpropsだけで表示が決まるため、実際のAPIと状態管理を用意せずに、判断の分かれる表示を直接確認できる。

Storybookのファイル名は`{部品}.stories.tsx`、テストのファイル名は`{部品}.ui.test.tsx`とし、対象の隣へ置く。

### 依存の向き

`app`から`shared`へ向かう一方向だけを許す。`app` → `pages` → `widgets` → `features` → `entities` → `shared`の順であり、下位の層は上位の層を読まない。`routes`は`pages`だけを読む。

この向きと、スライスの公開入口を経由することを`apps/web/oxlint.config.ts`の`no-restricted-imports`で検査する。

## 理由

層とスライスの二段で切るのは、画面の追加で読む範囲を一箇所へ収めるためである。層だけで切ると、メニュー表示の型、取得、表示部品が別々のディレクトリへ散る。スライスだけで切ると、複数画面が使う部品の置き場が決まらない。APIも業務領域で縦割りにしているため([`DEC-SYS-005`](DEC-SYS-005-api-internal-structure.md))、画面側も同じ領域名で切ると仕様、API、画面を対応させて読める。

PresenterとContainerを分けるのは、表示の分岐を実際の通信なしで確認できるようにするためである。売り切れ、特定原材料の未確認、取得失敗のように、業務上重要な分岐は表示側にある。Presenterがデータ取得を持つと、これらを確認するたびにAPIの応答か通信の失敗を用意することになる。propsだけで表示が決まれば、fixtureを渡すだけで済む。

Presenterへ上位の層を読ませないのは、部品の再利用先を型で保つためである。Presenterが上位の部品を直接読むと、その部品が使う場所ごとに読み込み先が増え、下位の部品が上位の構成へ依存する。要素を`slots`で受け取れば、差し込む側だけが構成を知る。

部品ごとにディレクトリを作るのは、PresenterとContainerへ分けた結果、一つの部品が実装、表示、テスト、Storybookの4ファイルになるためである。ファイルの種類で並べると、同じ部品に属するファイルが`ui`の直下へ散る。ディレクトリを部品の境界として使えば、部品を一つ読むために開く範囲がそのディレクトリに収まる。FSDは層とスライスの境界、および依存の向きだけを定め、スライスの内側の構成を定めていないため、この置き方を自分たちで決める必要がある。

層とスライス内の部品の数で置き方を変えないのは、`pages`のスライスが一つの部品しか持たない保証がないためである。FSDは再利用しない小さな部品を画面の中へ置くことを許しており、公式のチュートリアルも一つの画面のスライスへ複数の部品を置いている。数を条件にすると、部品を追加するたびに置き方を選び直すことになり、「画面の`ui`をフラットに保つために`widgets`へ出す」といった、層の意味とは無関係な理由が層の選択へ混ざる。

サーバー状態とクライアント状態を別の道具で扱うのは、必要な操作が異なるためである。在庫と販売可否は他の担当者の操作で変わるため、取得中、失敗、再取得、キャッシュの無効化が必要になる。注文候補の商品と個数は画面の中だけで完結し、これらの操作を必要としない。両方を同じ道具で持つと、片方には不要な状態を常に扱うことになる。

TanStack Queryを画面側に置くのは、注文確定後に在庫と販売可否を取り直す経路が必要になるためである。確定はサーバーの状態を変えるため、変更後に同じキーのキャッシュを無効化して再取得する。この結線を各画面へ手で書くと、画面ごとに再取得の抜けが生じる。

Query定義を`api`へ置くのは、`queryOptions`がサーバーへの要求とキャッシュキーの記述であり、画面が保持する状態ではないためである。`model`へ置くのは、Jotaiのatomのように画面が持つ状態に限る。さらにそれを所有する業務領域のスライスへ置くのは、キャッシュキーとその構造を、データを所有する場所と同じ場所で決めるためである。キーを利用側へ書くと、無効化の対象を画面ごとに推測することになる。

クエリが一本だけの領域でも`{領域}Queries`のオブジェクトにするのは、置き方をクエリの本数で変えないためである。本数を条件にすると、二本目を追加するときに書き換えが必要になり、いつ切り替えるかの判断が毎回発生する。

範囲キーを`{領域}QueryScopes`へ分けるのは、`{領域}Queries`の関数が返すものを`queryOptions`だけに揃えるためである。同じオブジェクトへキーを返す関数を混ぜると、`menuQueries.all()`と`menuQueries.list()`のように呼び出しの形が同じで返すものが違い、定義を開くまで区別できない。範囲キーとQueryの名前を分ければ、複数のQueryへ前方一致させる操作と、特定のQueryを扱う操作を利用箇所で読み分けられる。特定のQueryのキーは`queryOptions`に含まれるため、別のキーファクトリーへ重複して定義しない。

`index.ts`へ外から読むものだけを載せるのは、スライスの内側を変えたときに影響範囲を公開面から読めるようにするためである。使われていないものを公開すると、利用箇所を調べずに内側を変えられなくなる。

Storybookをテスト対象と揃えてPresenterだけへ向けるのは、確認する内容を一つに保つためである。Containerはデータ取得と結線だけを持つため、Storybookで確認する見た目を持たない。

## 影響

- 新しい画面を追加する手順は、必要な型とAPI呼び出しを`entities/{領域}`へ置き、`pages/{画面}/ui/{部品}/`へPresenterとContainerを作り、`src/routes/`へ経路を追加して`pages`の部品を貼ることである。
- 新しいスライスを追加する場合は`index.ts`を作り、そのスライスの外へ出すものだけを載せる。
- 表示の分岐を追加した場合は、Presenterのテストとfixtureを同じ変更で更新する。
- 経路を追加すると`src/routeTree.gen.ts`が再生成される。生成は`vite`の実行時に行われるため、経路の追加後は`pnpm web build`または`pnpm web dev`を通す。
- 試験は`src/testing/setup.ts`で描画結果を毎回破棄する。一つのファイルで複数回描画するため、破棄しないと前の描画が残って要素の取得が二重になる。
