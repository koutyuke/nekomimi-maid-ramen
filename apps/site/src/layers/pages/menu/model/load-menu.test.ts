import { describe, expect, it } from "vitest";

import { loadMenu } from "./load-menu";
import type { MenuItem } from "./menu";

const item: MenuItem = {
  id: "ramen",
  name: "<img src=x onerror=alert(1)>",
  description: "説明",
  price: 500,
  category: "main",
  sellable: false,
  allergenCheckState: "unchecked",
  containedAllergens: [],
};

describe("SPEC-VIS-002 / SPEC-VIS-004 公開メニュー", () => {
  it("売り切れと原材料の未確認・確認済みを区別し、取得内容をHTMLとして実行しない", async () => {
    const root = document.createElement("div");
    await loadMenu(root, () =>
      Promise.resolve([
        item,
        { ...item, id: "checked", sellable: true, allergenCheckState: "checked" },
        { ...item, id: "allergens", allergenCheckState: "checked", containedAllergens: [{ id: "milk", name: "乳" }] },
      ]),
    );
    expect(root.textContent).toContain("売り切れ");
    expect(root.textContent).toContain("販売中");
    expect(root.textContent).toContain("特定原材料: 未確認");
    expect(root.textContent).toContain("特定原材料: 含まれない");
    expect(root.textContent).toContain("特定原材料: 乳");
    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toContain(item.name);
  });
  it("再取得中と失敗時に前の商品を消し、失敗から再試行できる", async () => {
    const root = document.createElement("div");
    await loadMenu(root, () => Promise.resolve([item]));
    let reject!: (error: Error) => void;
    const pending = loadMenu(
      root,
      () =>
        new Promise((_, rejectPromise) => {
          reject = rejectPromise;
        }),
    );
    expect(root.textContent).toContain("読み込んでいます");
    expect(root.textContent).not.toContain(item.name);
    reject(new Error("private failure"));
    await pending;
    expect(root.textContent).toContain("表示できません");
    expect(root.textContent).not.toContain("private failure");
    expect(root.textContent).not.toContain("販売中");
    await loadMenu(root, () => Promise.resolve([]));
    expect(root.textContent).toContain("表示できる商品がありません");
  });
});
