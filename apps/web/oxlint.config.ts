import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [baseConfig],
  plugins: ["react", "jsx-a11y"],
  env: {
    browser: true,
  },
  rules: {
    // 新しいJSX変換を使うため、`React`を読み込む必要がない。
    "react/react-in-jsx-scope": "off",
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  },
  ignorePatterns: ["dist/**", ".wrangler/**", "routeTree.gen.ts"],
});
