import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

const featurePath = "**/{menu,operations,orders,realtime,staff}";

const coreModuleImports = {
  group: ["**/core/{adapters,infra}/*/**", "!**/core/{adapters,infra}/*/index", "!**/core/{adapters,infra}/*/index.ts"],
  message: "coreの技術モジュールは`core/{layer}/{module}`の公開入口から読む。内部ファイルを直接参照しない。",
};

const sharedModuleImports = {
  group: ["**/shared/*/**", "!**/shared/*/index", "!**/shared/*/index.ts"],
  message: "sharedのモジュールは`shared/{module}`の公開入口から読む。内部ファイルを直接参照しない。",
};

const routeImplementationImports = {
  group: ["**/*.live", "**/infra/**"],
  message: "実装ではなくポートを読む。機能をまたぐ実装の組み立ては`src/bootstrap`が行う。",
};

const layerImports = {
  group: ["**/features/*/layer", "**/layer"],
  message: "機能の外から`layer`を読むのは`src/bootstrap`だけである。",
};

const bootstrapImports = {
  group: ["**/bootstrap/**"],
  message: "起動時の組み立ては入口だけが読む。機能やルートからbootstrapへ依存しない。",
};

const productionTestImports = {
  group: ["**/tests", "**/tests/**", "**/testing", "**/testing/**"],
  message: "本番コードからテスト用のコードを読まない。",
};

const productionTestDirectories = {
  regex: "(?:^|/)(?:tests|testing)(?:/|$)",
  message: "本番コードからテスト用のコードを読まない。",
};

const featureBoundaryImports = {
  group: [
    `${featurePath}/**`,
    `!${featurePath}/public`,
    `!${featurePath}/public.ts`,
    `!${featurePath}/testing`,
    `!${featurePath}/testing/index`,
  ],
  message: "他の機能は公開面(`features/{機能}/public`)または`features/{機能}/testing`から読む。",
};

const coreAdapterImports = {
  group: ["**/core/adapters/**"],
  message: "`core/adapters`はルートハンドラのための処理であり、機能から読まない。",
};

export default defineConfig({
  extends: [baseConfig],
  plugins: [],
  jsPlugins: ["./lint-rules/use-case-gen.mjs"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [coreModuleImports, sharedModuleImports],
      },
    ],
    // Effectのタグ付きエラーはライブラリが定める`_tag`で種類を判別する。
    "no-underscore-dangle": [
      "error",
      {
        allow: ["_tag"],
      },
    ],
    "oxc/no-map-spread": "off",
  },
  ignorePatterns: ["dist/**", ".wrangler/**", "worker-configuration.d.ts", "drizzle/**"],
  // 同じルールのオプションは後続のoverrideで置き換わるため、共通制限も各設定に含める。
  overrides: [
    {
      files: ["src/bootstrap/create-app.ts", "src/public.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              {
                group: [
                  ...bootstrapImports.group,
                  "./runtime",
                  "./runtime.ts",
                  "./websocket-hub",
                  "./websocket-hub.ts",
                  "!**/bootstrap/create-app",
                  "!**/bootstrap/create-app.ts",
                ],
                message: "経路の合成と公開型は、実行環境の組み立てに依存しない。",
              },
              routeImplementationImports,
              layerImports,
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/*/application/use-cases/*.ts"],
      rules: { "nekomimi/use-case-gen": "error" },
    },
    {
      files: ["src/routes/**", "src/plugins/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              {
                group: [...bootstrapImports.group, "!**/bootstrap/create-app", "!**/bootstrap/create-app.ts"],
                message: bootstrapImports.message,
              },
              routeImplementationImports,
              {
                group: featureBoundaryImports.group,
                message: "機能は公開面(`features/{機能}/public`)から読む。",
              },
              layerImports,
            ],
          },
        ],
      },
    },
    {
      files: ["src/routes/**", "src/plugins/**"],
      // 経路のテストはtesting入口を使えるため、本番用の制限から除く。
      excludeFiles: [
        "src/routes/**/tests/**",
        "src/routes/**/testing/**",
        "src/routes/**/*.test.ts",
        "src/routes/**/*.spec.ts",
        "src/plugins/**/tests/**",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              routeImplementationImports,
              {
                group: [`${featurePath}/**`, `!${featurePath}/public`, `!${featurePath}/public.ts`],
                message: "機能は公開面(`features/{機能}/public`)から読む。",
              },
              layerImports,
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/shared/**"],
      excludeFiles: ["src/shared/**/tests/**", "src/shared/**/*.test.ts", "src/shared/**/*.spec.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/core/**", "!@nekomimi/core/**", "**/features/**", "**/routes/**", "**/plugins/**"],
                message: "`shared`はレイヤーや上位の機能へ依存しない。",
              },
              bootstrapImports,
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/core/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              sharedModuleImports,
              bootstrapImports,
              {
                group: ["**/{adapters,infra}/*/**", "!**/{adapters,infra}/*/index", "!**/{adapters,infra}/*/index.ts"],
                message:
                  "coreの技術モジュールは`core/{layer}/{module}`の公開入口から読む。内部ファイルを直接参照しない。",
              },
              {
                group: ["**/features/**"],
                message: "`core`は機能を読まない。共有する定義は`core`側へ置く。",
              },
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              featureBoundaryImports,
              coreAdapterImports,
              layerImports,
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/*/application/**", "src/features/*/domain/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              {
                group: [`${featurePath}/**`],
                message: "アプリケーションとドメインは他の機能を読まない。機能間の接続はアダプターで行う。",
              },
              {
                group: ["**/*.live", "**/infra/**"],
                message: "実装ではなくポートを読む。実装の組み立ては`layer.ts`で行う。",
              },
              coreAdapterImports,
              layerImports,
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/**/adapters/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "../../menu/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../operations/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../orders/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../menu/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../operations/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../orders/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
            ],
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              featureBoundaryImports,
              coreAdapterImports,
              {
                group: ["**/infra/**"],
                message: "アダプターは外部技術へ依存しない。保存先を使う実装は`infra`へ置く。",
              },
              layerImports,
              productionTestImports,
              productionTestDirectories,
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/**/infra/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              {
                group: ["**/adapters/**", "!better-auth/adapters/drizzle"],
                message: "保存先の実装からアダプターを読まない。",
              },
              {
                group: ["**/application/**", "!**/application/ports/outbound/**"],
                message: "保存先の実装はApplicationのoutboundポートだけを読む。",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/*/public.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              {
                group: [`${featurePath}/**`],
                message: "公開面は自機能の契約だけを公開し、他機能や内部実装を読まない。",
              },
              {
                group: ["**/*.live", "**/infra/**", "**/layer"],
                message: "公開面へ実装の組み立てを漏らさない。",
              },
              {
                group: productionTestImports.group,
                message: "公開面からテスト用のコードを読まない。",
              },
              {
                regex: productionTestDirectories.regex,
                message: "公開面からテスト用のコードを読まない。",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["src/features/*/layer.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              {
                group: [
                  `${featurePath}/**`,
                  "!./adapters/**",
                  "!./application/**",
                  "!./domain/**",
                  "!./infra/**",
                  "!./public",
                  "!./public.ts",
                ],
                message: "layerは自機能の実装を組み立て、他機能は公開面から読む。",
              },
              {
                group: layerImports.group,
                message: "layerから他のlayerを読まない。",
              },
              {
                group: productionTestImports.group,
                message: "layerからテスト用のコードを読まない。",
              },
              {
                regex: productionTestDirectories.regex,
                message: "layerからテスト用のコードを読まない。",
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        "src/features/**/tests/**",
        "src/features/**/testing/**",
        "src/features/**/*.test.ts",
        "src/features/**/*.spec.ts",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              sharedModuleImports,
              bootstrapImports,
              {
                group: featureBoundaryImports.group,
                message: "テスト用コードも他機能の公開面またはtesting入口だけを読む。",
              },
            ],
          },
        ],
      },
    },
  ],
});
