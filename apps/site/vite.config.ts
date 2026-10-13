import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fontSubsetter } from "rollup-plugin-font-subsetter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import svgr from "vite-plugin-svgr";
import type { Plugin } from "vite";

import { buildPageHead, PAGE_HEADS } from "./src/layers/app/head";

const escapeHTML = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const attributes = (values: object) =>
  Object.entries(values)
    .map(([key, value]) => ` ${key}="${escapeHTML(String(value))}"`)
    .join("");

// `data-page-head`を付けたタグは、起動時に取り除かれて経路の`head`が描画する同じタグに置き換わる。
const pageHeadTags = ({ meta, links }: ReturnType<typeof buildPageHead>) => [
  ...meta.map(({ title, ...rest }) =>
    title === undefined
      ? `<meta data-page-head${attributes(rest)} />`
      : `<title data-page-head>${escapeHTML(title)}</title>`,
  ),
  ...links.map((link) => `<link data-page-head${attributes(link)} />`),
];

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

      for (const [path, head] of Object.entries(PAGE_HEADS)) {
        const tags = pageHeadTags(buildPageHead(path, head));
        const source = template.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);

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
