import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { menuItemsFixture } from "../../../../entities/menu/testing";
import { MenuSectionUI } from "./menu-section.ui";

describe("SPEC-VIS-002 メニューを表示する", () => {
  it("渡された商品の名称と価格をカードで表示し、販売可否は表示しない", () => {
    render(<MenuSectionUI items={menuItemsFixture} />);
    for (const item of menuItemsFixture) {
      const card = screen.getByRole("button", { name: new RegExp(item.name) });
      expect(within(card).getByText(`¥${item.price}`)).toBeDefined();
    }
    expect(document.body.textContent).not.toMatch(/売り切れ|販売中/);
  });

  // 閉じた後に選んだカードへフォーカスが戻ることは、ブラウザで確かめる。
  // 試験環境では要素の大きさを測れず、カードへ縮むアニメーションが終わらないため、詳細が外れる時点まで進まない。
  it("カードを選ぶと詳細を開き、閉じるボタンで閉じる", async () => {
    render(<MenuSectionUI items={menuItemsFixture} />);
    fireEvent.click(screen.getByRole("button", { name: /ラーメン/ }));
    const dialog = await screen.findByRole("dialog", { name: "ラーメン" });
    expect(within(dialog).getByText("¥500")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await waitFor(() => expect(dialog.hasAttribute("data-closed")).toBe(true));
  });
});
