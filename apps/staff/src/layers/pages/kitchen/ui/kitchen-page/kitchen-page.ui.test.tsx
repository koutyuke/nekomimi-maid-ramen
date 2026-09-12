import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { kitchenPageFixture } from "../../testing";
import { KitchenPageUI } from "./kitchen-page.ui";

describe("SPEC-KIT-001 SPEC-KIT-002 調理画面の操作", () => {
  it("ドリンクを除外し、対応状況と注文番号で並べる", () => {
    render(<KitchenPageUI {...kitchenPageFixture} />);
    expect(screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"))).toEqual([
      "注文2",
      "注文1",
    ]);
    expect(screen.queryByText(/烏龍茶/)).toBeNull();
    expect(screen.queryByRole("article", { name: "注文3" })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "対応済みを非表示" }));
    expect(screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"))).toEqual([
      "注文2",
      "注文1",
      "注文3",
    ]);
  });

  it("担当範囲で商品行と対応済みを再計算する", () => {
    const order = {
      ...kitchenPageFixture.orders[0]!,
      lines: kitchenPageFixture.orders[0]!.lines.map((line) =>
        Object.assign({}, line, {
          cookingState: line.category === "main" ? ("completed" as const) : ("unstarted" as const),
        }),
      ),
    };
    render(<KitchenPageUI {...kitchenPageFixture} orders={[order]} />);
    expect(screen.getByRole("article", { name: "注文1" })).toBeDefined();

    fireEvent.change(screen.getByRole("combobox", { name: "表示する商品" }), { target: { value: "main" } });
    expect(screen.queryByRole("article", { name: "注文1" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "対応済みを非表示" }));
    const article = screen.getByRole("article", { name: "注文1" });
    expect(within(article).getByText("対応済み")).toBeDefined();
    expect(within(article).getByText(/ラーメン/)).toBeDefined();
    expect(within(article).queryByText(/餃子/)).toBeNull();
  });

  it("未調理は着手でき、調理中は完成または着手取消だけを選べる", () => {
    const onUpdate = vi.fn();
    render(<KitchenPageUI {...kitchenPageFixture} actions={{ onRetry: vi.fn(), onUpdate }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文1のラーメンの調理を開始" }));
    expect(onUpdate).toHaveBeenCalledWith(
      kitchenPageFixture.orders[0],
      kitchenPageFixture.orders[0]!.lines[0],
      "cooking",
    );
    expect(screen.getByRole("button", { name: "注文2のラーメンを完成" })).toBeDefined();
    expect(screen.getByRole("button", { name: "注文2のラーメンを未調理に戻す" })).toBeDefined();
    fireEvent.click(screen.getByRole("checkbox", { name: "対応済みを非表示" }));
    expect(within(screen.getByRole("article", { name: "注文3" })).queryByRole("button")).toBeNull();
  });
  it.each([{ connected: false }, { failed: true }, { pending: true }])(
    "通信断・取得失敗・保存中は更新を止める: %o",
    (state) => {
      render(<KitchenPageUI {...kitchenPageFixture} {...state} />);
      expect(screen.getByRole("button", { name: "注文1のラーメンの調理を開始" }).hasAttribute("disabled")).toBe(true);
    },
  );
  it("権限のない利用者には注文内容を出さない", () => {
    render(<KitchenPageUI {...kitchenPageFixture} access="denied" />);
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("スタッフ権限");
  });
  it("取得失敗を注文なしと誤表示せず、再試行を提供する", () => {
    const onRetry = vi.fn();
    render(<KitchenPageUI {...kitchenPageFixture} orders={[]} failed actions={{ onRetry, onUpdate: vi.fn() }} />);
    expect(screen.queryByText("表示する注文はありません。")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
