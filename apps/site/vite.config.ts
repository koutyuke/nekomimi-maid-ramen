import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fontSubsetter } from "rollup-plugin-font-subsetter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import svgr from "vite-plugin-svgr";
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
      // 共有用の画像は全ページで共通のため、経路の`head`では描画せず初期HTMLにだけ置く。
      const sharedTags = [
        `<meta property="og:type" content="website" />`,
        `<meta property="og:image" content="${canonicalURL("/ogp.jpg")}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:image:alt" content="猫耳メイドラーメンのロゴと、ラーメンを持つ猫耳メイドのイラスト" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
      ];
      const template = String(index.source);

      for (const [path, { title, description }] of Object.entries(PAGE_HEADS)) {
        const url = escapeHTML(canonicalURL(path));
        const tags = [
          `<title data-page-head>${escapeHTML(title)}</title>`,
          `<meta data-page-head name="description" content="${escapeHTML(description)}" />`,
          `<link data-page-head rel="canonical" href="${url}" />`,
          `<meta data-page-head property="og:title" content="${escapeHTML(title)}" />`,
          `<meta data-page-head property="og:description" content="${escapeHTML(description)}" />`,
          `<meta data-page-head property="og:url" content="${url}" />`,
          ...sharedTags,
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
    svgr(),
    fontSubsetter(),
    pageHTML(),
  ],
});
