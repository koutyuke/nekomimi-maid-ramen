import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../../../testing/render";
import { orderEntryPageFixture } from "../testing";
import { OrderEntryPageUI } from "./order-entry-page.ui";

describe("SPEC-SAL-003〜004 / SPEC-INV-001 会計の表示", () => {
  it("確認ダイアログを開いた後に商品取得が失敗したら承認を止める", async () => {
    const page = render(<OrderEntryPageUI {...orderEntryPageFixture} />);
    fireEvent.click(screen.getByRole("button", { name: "注文を確定" }));
    await screen.findByRole("dialog", { name: "注文を確定してよいですか？" });
    page.rerender(<OrderEntryPageUI {...orderEntryPageFixture} menuFailed />);
    const dialog = screen.getByRole("dialog", { name: "注文を確定してよいですか？" });
    expect(within(dialog).getByRole("button", { name: "はい、確定する" }).hasAttribute("disabled")).toBe(true);
  });
  it("販売可否の取得に失敗したときキャッシュが残っていても確定を止める", () => {
    render(<OrderEntryPageUI {...orderEntryPageFixture} menuFailed />);
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
  it("選択した商品が一覧から消えても、数量を減らす操作を残す", () => {
    render(<OrderEntryPageUI {...orderEntryPageFixture} items={[]} />);
    expect(screen.getByRole("button", { name: "ラーメンを1個減らす" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
  it("受取金額が合計と等しければお釣りは0円になる", () => {
    render(<OrderEntryPageUI {...orderEntryPageFixture} received="1600" />);
    expect(screen.getByText("お釣り：0円")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(false);
  });
});
