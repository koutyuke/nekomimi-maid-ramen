import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

const featurePath = "**/{inventory,visitor-information,sales,kitchen,handoff,operations,system-wide}";

const coreModuleImports = {
  group: ["**/core/{adapters,infra}/*/**", "!**/core/{adapters,infra}/*/index", "!**/core/{adapters,infra}/*/index.ts"],
  message: "coreの技術モジュールは`core/{layer}/{module}`の公開入口から読む。内部ファイルを直接参照しない。",
};

const routeImplementationImports = {
  group: ["**/*.live", "**/infra/**"],
  message: "実装ではなくポートを読む。実装の組み立ては`src/index.ts`が行う。",
};

const layerImports = {
  group: ["**/features/*/layer", "**/layer"],
  message: "`layer`を読むのは`src/index.ts`だけである。",
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
    featurePath,
    `${featurePath}/**`,
    `!${featurePath}/public`,
    `!${featurePath}/public.ts`,
    `!${featurePath}/testing`,
    `!${featurePath}/testing/index`,
  ],
  message: "他の業務領域は公開面(`features/{領域}/public`)または`features/{領域}/testing`から読む。",
};

const coreAdapterImports = {
  group: ["**/core/adapters/**"],
  message: "`core/adapters`はルートハンドラのための処理であり、業務領域から読まない。",
};

export default defineConfig({
  extends: [baseConfig],
  plugins: [],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [coreModuleImports],
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
      files: ["src/routes/**", "src/plugins/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              coreModuleImports,
              routeImplementationImports,
              {
                group: featureBoundaryImports.group,
                message: "業務領域は公開面(`features/{領域}/public`)から読む。",
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
              routeImplementationImports,
              {
                group: [featurePath, `${featurePath}/**`, `!${featurePath}/public`, `!${featurePath}/public.ts`],
                message: "業務領域は公開面(`features/{領域}/public`)から読む。",
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
      files: ["src/core/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/{adapters,infra}/*/**", "!**/{adapters,infra}/*/index", "!**/{adapters,infra}/*/index.ts"],
                message:
                  "coreの技術モジュールは`core/{layer}/{module}`の公開入口から読む。内部ファイルを直接参照しない。",
              },
              {
                group: ["**/features/**"],
                message: "`core`は業務領域を読まない。共有する定義は`core`側へ置く。",
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
              {
                group: [featurePath, `${featurePath}/**`],
                message: "アプリケーションとドメインは他の業務領域を読まない。領域間の接続はアダプターで行う。",
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
                name: "../../inventory/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../sales/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../visitor-information/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../inventory/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../sales/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
              {
                name: "../../../visitor-information/testing",
                message: "本番コードからテスト用の入口を読まない。",
              },
            ],
            patterns: [
              coreModuleImports,
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
              {
                group: [featurePath, `${featurePath}/**`],
                message: "公開面は自領域の契約だけを公開し、他領域や内部実装を読まない。",
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
              {
                group: [
                  featurePath,
                  `${featurePath}/**`,
                  "!./adapters/**",
                  "!./application/**",
                  "!./domain/**",
                  "!./infra/**",
                  "!./public",
                  "!./public.ts",
                ],
                message: "layerは自領域の実装を組み立て、他領域は公開面から読む。",
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
              {
                group: featureBoundaryImports.group,
                message: "テスト用コードも他領域の公開面またはtesting入口だけを読む。",
              },
            ],
          },
        ],
      },
    },
  ],
});
