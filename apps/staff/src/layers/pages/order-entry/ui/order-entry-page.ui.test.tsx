import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render-ui";
import { orderEntryPageFixture } from "../testing";
import { OrderEntryPageUI } from "./order-entry-page.ui";

describe("SPEC-SAL-003〜004 / SPEC-INV-001 会計の表示", () => {
  it("商品取得に失敗しても候補を表示し、ロック中でなければ数量を減らせる", () => {
    const onChangeQuantity = vi.fn();
    const props = {
      ...orderEntryPageFixture,
      menu: { status: "error" as const, data: orderEntryPageFixture.menu.data },
      canConfirm: false,
      onChangeQuantity,
    };
    const page = render(<OrderEntryPageUI {...props} />);

    expect(screen.getByRole("alert").textContent).toContain("商品情報を取得できません");
    const decrease = screen.getByRole("button", { name: "ラーメンを1個減らす" });
    const increase = screen.getByRole("button", { name: "ラーメンを1個増やす" });
    expect(decrease.hasAttribute("disabled")).toBe(false);
    expect(increase.hasAttribute("disabled")).toBe(true);
    fireEvent.click(increase);
    expect(onChangeQuantity).not.toHaveBeenCalled();
    fireEvent.click(decrease);
    expect(onChangeQuantity).toHaveBeenCalledExactlyOnceWith(orderEntryPageFixture.draft.lines[0]!.item, -1);

    page.rerender(<OrderEntryPageUI {...props} confirmation={{ status: "uncertain", rejection: null }} />);
    expect(decrease.hasAttribute("disabled")).toBe(true);
    fireEvent.click(decrease);
    expect(onChangeQuantity).toHaveBeenCalledTimes(1);
  });

  it("確認ダイアログを開いた後に確定不可へ変わったら承認を止める", async () => {
    const page = render(<OrderEntryPageUI {...orderEntryPageFixture} />);
    fireEvent.click(screen.getByRole("button", { name: "注文を確定" }));
    await screen.findByRole("dialog", { name: "注文を確定してよいですか？" });
    page.rerender(<OrderEntryPageUI {...orderEntryPageFixture} canConfirm={false} />);
    const dialog = screen.getByRole("dialog", { name: "注文を確定してよいですか？" });
    expect(within(dialog).getByRole("button", { name: "はい、確定する" }).hasAttribute("disabled")).toBe(true);
  });
  it("選択した商品が一覧から消えても、数量を減らす操作を残す", () => {
    render(<OrderEntryPageUI {...orderEntryPageFixture} menu={{ status: "success", data: [] }} canConfirm={false} />);
    expect(screen.getByRole("button", { name: "ラーメンを1個減らす" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
});
