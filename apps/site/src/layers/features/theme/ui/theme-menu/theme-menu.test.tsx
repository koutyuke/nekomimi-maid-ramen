import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeMenu } from "./theme-menu";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset["theme"];
});

// メニューの部品は操作されてから読み込むため、読み込みの前後どちらで操作しても同じように動くことを確かめる。
describe("テーマメニュー", () => {
  it("最初の押下でメニューを開き、選んだテーマを反映する", async () => {
    render(<ThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "テーマを切り替える" }));

    fireEvent.click(await screen.findByRole("menuitemradio", { name: "ダーク" }));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("フォーカスしたまま部品が読み込まれても、フォーカスはボタンに残る", async () => {
    render(<ThemeMenu />);
    screen.getByRole("button", { name: "テーマを切り替える" }).focus();

    await waitFor(() => expect(document.activeElement?.getAttribute("aria-haspopup")).toBe("menu"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "テーマを切り替える" }));
  });
});
