import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getMenu } from "../../api/get-menu";
import { MenuPage } from "./menu-page";
import type { MenuItem } from "../../model/menu";

vi.mock("../../api/get-menu", () => ({ getMenu: vi.fn() }));

const item: MenuItem = {
  id: "ramen",
  name: "ラーメン",
  description: "説明",
  price: 500,
  category: "main",
  sellable: false,
  allergenCheckState: "unchecked",
  containedAllergens: [],
};

describe("SPEC-VIS-002 / SPEC-VIS-004 公開メニュー", () => {
  it("売り切れと原材料の未確認・確認済みを区別して表示する", async () => {
    vi.mocked(getMenu).mockResolvedValueOnce([
      item,
      { ...item, id: "checked", sellable: true, allergenCheckState: "checked" },
      { ...item, id: "allergens", allergenCheckState: "checked", containedAllergens: [{ id: "milk", name: "乳" }] },
    ]);
    render(<MenuPage />);
    expect(await screen.findAllByText("売り切れ")).toHaveLength(2);
    const text = document.body.textContent;
    expect(text).toContain("販売中");
    expect(text).toContain("特定原材料: 未確認");
    expect(text).toContain("特定原材料: 含まれない");
    expect(text).toContain("特定原材料: 乳");
  });

  it("取得の失敗を詳細を伏せて案内し、再読み込みで取得し直す", async () => {
    let resolveRetry!: (items: readonly MenuItem[]) => void;
    vi.mocked(getMenu)
      .mockRejectedValueOnce(new Error("private failure"))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRetry = resolve;
          }),
      );
    render(<MenuPage />);
    fireEvent.click(await screen.findByRole("button", { name: "再読み込み" }));
    expect(document.body.textContent).toContain("読み込んでいます");
    expect(document.body.textContent).not.toContain("表示できません");
    resolveRetry([]);
    expect(await screen.findByText("表示できる商品がありません。")).toBeDefined();
    expect(document.body.textContent).not.toContain("private failure");
  });
});
