import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

// FSDの層。下位の層だけを読めるよう、層ごとに上位の層の読み込みを禁じる。
const upperLayerImports = (layers: readonly string[]) => ({
  group: layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]),
  message: "層は下位の層だけを読む。上位の層へ渡す値は引数か`slots`で受け取る。",
});

const sliceLayers = "**/{entities,features,widgets,pages}";

const slicePublicEntryImports = {
  group: [
    `${sliceLayers}/*/**`,
    `!${sliceLayers}/*/index`,
    `!${sliceLayers}/*/index.ts`,
    `!${sliceLayers}/*/testing`,
    `!${sliceLayers}/*/testing/index`,
  ],
  message: "他のスライスは公開入口(`{層}/{スライス}`)またはテスト用入口(`{層}/{スライス}/testing`)から読む。",
};

const restrictedImports = (patterns: readonly unknown[]) =>
  [
    "error",
    {
      paths: [{ name: "@nekomimi/api", allowImportNames: ["App"], message: "APIから読むのはApp型だけである。" }],
      patterns,
    },
  ] satisfies ["error", unknown];

export default defineConfig({
  extends: [baseConfig],
  plugins: ["react", "jsx-a11y"],
  jsPlugins: ["./lint-rules/fsd.mjs"],
  env: {
    browser: true,
  },
  rules: {
    "staff-fsd/testing-entrypoint": "error",
    "staff-fsd/no-hook-spread": "error",
    "staff-fsd/no-cross-slice-imports": "error",
    "no-restricted-imports": restrictedImports([]),
    // 新しいJSX変換を使うため、`React`を読み込む必要がない。
    "react/react-in-jsx-scope": "off",
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  },
  ignorePatterns: ["dist/**", ".wrangler/**", "routeTree.gen.ts"],
  // 同じルールのオプションは後続のoverrideで置き換わるため、共通制限も各設定に含める。
  overrides: [
    {
      files: ["src/layers/shared/**"],
      rules: {
        "no-restricted-imports": restrictedImports([
          upperLayerImports(["app", "pages", "widgets", "features", "entities"]),
        ]),
      },
    },
    {
      files: ["src/layers/entities/**"],
      rules: {
        "no-restricted-imports": restrictedImports([
          upperLayerImports(["app", "pages", "widgets", "features"]),
          slicePublicEntryImports,
        ]),
      },
    },
    {
      files: ["src/layers/features/**"],
      rules: {
        "no-restricted-imports": restrictedImports([
          upperLayerImports(["app", "pages", "widgets"]),
          slicePublicEntryImports,
        ]),
      },
    },
    {
      files: ["src/layers/widgets/**"],
      rules: {
        "no-restricted-imports": restrictedImports([upperLayerImports(["app", "pages"]), slicePublicEntryImports]),
      },
    },
    {
      files: ["src/layers/pages/**"],
      rules: {
        "no-restricted-imports": restrictedImports([upperLayerImports(["app"]), slicePublicEntryImports]),
      },
    },
    {
      files: ["src/routes/**"],
      rules: {
        "no-restricted-imports": restrictedImports([
          {
            group: [
              ...upperLayerImports(["shared", "entities", "features", "widgets"]).group,
              "!**/widgets/layout",
              "!**/widgets/layout/index",
              "!**/widgets/layout/index.ts",
            ],
            message: "経路は画面と共通レイアウトを結線する。部品の見た目とデータ取得は経路へ書かない。",
          },
          slicePublicEntryImports,
        ]),
      },
    },
  ],
});
