import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

const upperLayerImports = (layers: readonly string[]) => ({
  group: layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]),
  message: "層は下位の層だけを読む。上位の層へ渡す値は引数かpropsで受け取る。",
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

type RestrictedImportPattern = ReturnType<typeof upperLayerImports>;

const restrictedImports = (patterns: RestrictedImportPattern[]) => ["error", { patterns }] satisfies ["error", unknown];

export default defineConfig({
  extends: [baseConfig],
  plugins: ["react", "jsx-a11y"],
  env: { browser: true },
  rules: {
    "no-restricted-imports": restrictedImports([]),
    "react/react-in-jsx-scope": "off",
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  },
  ignorePatterns: ["dist/**", ".wrangler/**", "routeTree.gen.ts"],
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
      files: ["src/layers/app/**"],
      rules: {
        "no-restricted-imports": restrictedImports([slicePublicEntryImports]),
      },
    },
    {
      files: ["src/routes/**"],
      rules: {
        "no-restricted-imports": restrictedImports([upperLayerImports(["shared", "entities", "features", "widgets"])]),
      },
    },
  ],
});
