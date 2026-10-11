import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MENU_ITEMS } from "../model/menu";
import { MenuSection } from "./menu-section";
import { ProductDetail } from "./product-detail";
import type { AllergenId, AllergenStatus } from "../model/menu";

const allAllergens = (status: AllergenStatus): Record<AllergenId, AllergenStatus> => ({
  "allergen-shrimp": status,
  "allergen-crab": status,
  "allergen-cashew-nut": status,
  "allergen-walnut": status,
  "allergen-wheat": status,
  "allergen-buckwheat": status,
  "allergen-egg": status,
  "allergen-milk": status,
  "allergen-peanut": status,
});

const [ramen] = MENU_ITEMS;
if (!ramen) {
  throw new Error("試験に使う商品がない");
}

describe("SPEC-VIS-002 メニューを表示する", () => {
  it("APIを使わずに全商品の名称と価格をカードで表示し、販売可否は表示しない", () => {
    render(<MenuSection />);
    for (const item of MENU_ITEMS) {
      const card = screen.getByRole("button", { name: new RegExp(item.name) });
      expect(within(card).getByText(`¥${item.price}`)).toBeDefined();
    }
    expect(document.body.textContent).not.toMatch(/売り切れ|販売中/);
  });

  // 閉じた後に選んだカードへフォーカスが戻ることは、ブラウザで確かめる。
  // 試験環境では要素の大きさを測れず、カードへ縮むアニメーションが終わらないため、詳細が外れる時点まで進まない。
  it("カードを選ぶと詳細を開き、閉じるボタンで閉じる", async () => {
    render(<MenuSection />);
    fireEvent.click(screen.getByRole("button", { name: /ラーメン/ }));
    const dialog = await screen.findByRole("dialog", { name: "ラーメン" });
    expect(within(dialog).getByText("¥500")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await waitFor(() => expect(dialog.hasAttribute("data-closed")).toBe(true));
  });
});

describe("SPEC-VIS-004 商品に含まれる特定原材料を表示する", () => {
  it("確認済みの商品は9品目ごとに使用状況と記号の意味を表示する", () => {
    const allergens = {
      ...allAllergens("absent"),
      "allergen-wheat": "contains",
      "allergen-milk": "may-contain",
    } as const;
    render(<ProductDetail item={{ ...ramen, allergens }} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(9);
    expect(screen.getByRole("listitem", { name: "小麦: 使用" })).toBeDefined();
    expect(screen.getByRole("listitem", { name: "乳: 可能性あり" })).toBeDefined();
    expect(screen.getByRole("listitem", { name: "えび: 不使用" })).toBeDefined();
    expect(document.body.textContent).toContain("調理過程での接触及び、使用製品での含有の可能性があります");
  });

  it("未確認の商品は品目の一覧を出さず、確認中であることだけを表示する", () => {
    render(<ProductDetail item={{ ...ramen, allergens: null }} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(document.body.textContent).toContain("確認中");
    expect(document.body.textContent).not.toContain("使用していません");
  });
});
