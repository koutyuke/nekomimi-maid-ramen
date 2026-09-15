import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const layersRoot = fileURLToPath(new URL("../src/layers", import.meta.url));
const sliceLayers = new Set(["entities", "features", "widgets", "pages"]);

export default {
  meta: { name: "staff-fsd" },
  rules: {
    "testing-entrypoint": {
      meta: {
        type: "problem",
        schema: [],
        messages: { implementation: "testing/index.tsは再公開だけを行う。fixture・mockの実装は別ファイルへ置く。" },
      },
      create(context) {
        if (!context.filename.endsWith(`${sep}testing${sep}index.ts`)) {
          return {};
        }
        return {
          Program(node) {
            for (const statement of node.body) {
              if (
                !(
                  (statement.type === "ExportNamedDeclaration" || statement.type === "ExportAllDeclaration") &&
                  statement.source
                )
              ) {
                context.report({ node: statement, messageId: "implementation" });
              }
            }
          },
        };
      },
    },
    "no-hook-spread": {
      meta: {
        type: "problem",
        schema: [],
        messages: { spread: "フックの戻り値をJSXへ直接展開しない。必要な値を取り出し、propsを明示する。" },
      },
      create(context) {
        return {
          JSXSpreadAttribute(node) {
            const call = node.argument;
            const name = call.callee?.name ?? call.callee?.property?.name;
            if (call.type === "CallExpression" && /^use[A-Z0-9]/.test(name ?? "")) {
              context.report({ node, messageId: "spread" });
            }
          },
        };
      },
    },
    "presenter-dependencies": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          connection:
            "表示境界はアプリの通信・ストア・ルーターへ直接接続しない。接続をContainerへ移すか、通常の部品として構成する。",
        },
      },
      create(context) {
        if (!context.filename.endsWith(".ui.tsx")) {
          return {};
        }
        const check = (node) => {
          if (node.importKind === "type" || node.exportKind === "type") {
            return;
          }
          const source = node.source?.value;
          if (
            typeof source === "string" &&
            (/^(?:@tanstack\/react-(?:query|router)|jotai)(?:\/|$)/.test(source) || /(?:^|\/)api(?:\/|$)/.test(source))
          ) {
            context.report({ node: node.source, messageId: "connection" });
          }
        };
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
        };
      },
    },
    "no-cross-slice-imports": {
      meta: {
        type: "problem",
        schema: [],
        messages: { crossSlice: "同じ層の別スライスは参照できない。共通処理は下位の層へ、結線は上位の層へ置く。" },
      },
      create(context) {
        const [layer, slice] = relative(layersRoot, context.filename).split(sep);
        if (!sliceLayers.has(layer)) {
          return {};
        }

        const check = (node) => {
          const source = node.source?.value;
          if (typeof source !== "string" || !source.startsWith(".")) {
            return;
          }
          const [targetLayer, targetSlice] = relative(layersRoot, resolve(dirname(context.filename), source)).split(
            sep,
          );
          if (targetLayer === layer && targetSlice && targetSlice !== slice) {
            context.report({ node: node.source, messageId: "crossSlice" });
          }
        };
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
        };
      },
    },
  },
};
