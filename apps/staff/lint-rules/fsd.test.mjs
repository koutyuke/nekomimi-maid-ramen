// @vitest-environment node
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import plugin from "./fsd.mjs";

it("相対パスの書き方や再公開にかかわらず同じ層の別スライスを拒否する", () => {
  const filename = fileURLToPath(new URL("../src/layers/features/example/model/use-example.ts", import.meta.url));
  for (const visitor of ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "ImportExpression"]) {
    for (const [source, forbidden] of [
      ["../../sync-data", true],
      ["../../../features/sync-data", true],
      ["../../sync-data/index.ts", true],
      ["../../sync-data/model/use-realtime", true],
      ["../api/update", false],
      ["../../../features/example/api/update", false],
      ["../../../entities/orders", false],
      ["../../../shared/api", false],
      ["react", false],
    ]) {
      const reports = [];
      const rule = plugin.rules["no-cross-slice-imports"].create({
        filename,
        report: (report) => reports.push(report),
      });
      rule[visitor]({ source: { value: source } });
      expect(reports.length, `${visitor}: ${source}`).toBe(forbidden ? 1 : 0);
    }
  }
});

it("表示境界のアプリ接続を拒否し、表示環境と型だけの参照を許す", () => {
  for (const [source, importKind, forbidden] of [
    ["@tanstack/react-router", "value", true],
    ["@tanstack/react-query", "value", true],
    ["jotai", "value", true],
    ["../../api/confirm-order", "value", true],
    ["../../api/confirm-order", "type", false],
    ["@mantine/core", "value", false],
    ["react", "value", false],
    ["../../model/checkout", "value", false],
  ]) {
    const reports = [];
    const rule = plugin.rules["presenter-dependencies"].create({
      filename: "/app/example.ui.tsx",
      report: (report) => reports.push(report),
    });
    rule.ImportDeclaration({ source: { value: source }, importKind });
    expect(reports.length, source).toBe(forbidden ? 1 : 0);
  }
});

it("テスト用入口は実装を持たず、別ファイルから再公開する", () => {
  const reports = [];
  const declaration = { type: "ExportNamedDeclaration", declaration: { type: "VariableDeclaration" } };
  const rule = plugin.rules["testing-entrypoint"].create({
    filename: "/app/testing/index.ts",
    report: (report) => reports.push(report),
  });
  rule.Program({
    body: [
      { type: "ExportNamedDeclaration", source: { value: "./example.fixtures" } },
      { type: "ExportAllDeclaration", source: { value: "./example.mock" } },
      declaration,
    ],
  });
  expect(reports.map((report) => report.node)).toEqual([declaration]);
});

it("フック呼び出しの直接展開を拒否し、ストーリーのargs展開は許す", () => {
  const reports = [];
  const rule = plugin.rules["no-hook-spread"].create({ report: (report) => reports.push(report) });
  for (const argument of [
    { type: "CallExpression", callee: { name: "useOrderManagement" } },
    { type: "CallExpression", callee: { property: { name: "useHandoff" } } },
    { type: "Identifier", name: "args" },
  ]) {
    rule.JSXSpreadAttribute({ argument });
  }
  expect(reports).toHaveLength(2);
});
