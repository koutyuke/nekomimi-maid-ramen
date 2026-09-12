import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

const upperLayerImports = (layers: readonly string[]) => ({
  group: layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]),
  message: "層は下位の層だけを読む。上位の層へ渡す値は引数かpropsで受け取る。",
});

const slicePublicEntryImports = {
  group: ["**/{features,pages}/*/**", "!**/{features,pages}/*/index", "!**/{features,pages}/*/index.ts"],
  message: "他のスライスは公開入口(`{層}/{スライス}`)から読む。",
};

type RestrictedImportPattern = ReturnType<typeof upperLayerImports>;

const restrictedImports = (patterns: RestrictedImportPattern[]) =>
  [
    "error",
    {
      paths: [{ name: "@nekomimi/api", allowImportNames: ["App"], message: "APIから読むのはApp型だけである。" }],
      patterns,
    },
  ] satisfies ["error", unknown];

export default defineConfig({
  extends: [baseConfig],
  env: { browser: true },
  rules: {
    "no-restricted-imports": restrictedImports([]),
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  },
  ignorePatterns: ["dist/**", ".astro/**", ".wrangler/**"],
  overrides: [
    {
      files: ["src/layers/shared/**"],
      rules: {
        "no-restricted-imports": restrictedImports([upperLayerImports(["app", "pages", "features"])]),
      },
    },
    {
      files: ["src/layers/features/**"],
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
      files: ["src/pages/**"],
      rules: {
        "no-restricted-imports": restrictedImports([upperLayerImports(["shared", "features"])]),
      },
    },
  ],
});
