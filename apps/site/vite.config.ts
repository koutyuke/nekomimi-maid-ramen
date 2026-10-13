import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fontSubsetter } from "rollup-plugin-font-subsetter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import type { Plugin } from "vite";

import { canonicalURL, PAGE_HEADS } from "./src/routes/-page-heads";

const escapeHTML = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// JavaScriptを実行しないクローラー向けに、経路ごとのHTML(`/terms`なら`terms.html`)を書き出す。
const pageHTML = (): Plugin => ({
  name: "page-html",
  apply: "build",
  generateBundle: {
    order: "post",
    handler(_, bundle) {
      // Storybookのビルドは`index.html`を出力しない。
      const index = bundle["index.html"];
      if (index?.type !== "asset") {
        return;
      }
      const template = String(index.source);

      for (const [path, { title, description }] of Object.entries(PAGE_HEADS)) {
        const tags = [
          `<title data-page-head>${escapeHTML(title)}</title>`,
          `<meta data-page-head name="description" content="${escapeHTML(description)}" />`,
          `<link data-page-head rel="canonical" href="${escapeHTML(canonicalURL(path))}" />`,
        ].join("\n    ");
        const source = template.replace("</head>", `  ${tags}\n  </head>`);

        if (path === "/") {
          index.source = source;
        } else {
          this.emitFile({ type: "asset", fileName: `${path.slice(1)}.html`, source });
        }
      }
    },
  },
});

export default defineConfig({
  // 経路を走査して`routeTree.gen.ts`を書き出すため、Reactの変換より先に置く。
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: "\\.(test|stories)\\.tsx?$",
    }),
    react(),
    tailwindcss(),
    imagetools(),
    fontSubsetter(),
    pageHTML(),
  ],
});
