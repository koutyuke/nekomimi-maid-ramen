import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { kitchenPageFixture } from "../../testing";
import { KitchenPageUI } from "./kitchen-page.ui";

describe("SPEC-KIT-001 SPEC-KIT-002 調理画面の操作", () => {
  it("保存中の商品だけを無効にし、同じ注文の別商品と別注文は操作できる", () => {
    const onUpdate = vi.fn();
    render(
      <KitchenPageUI
        {...kitchenPageFixture}
        pendingLines={[{ orderId: "order-1", menuItemId: "ramen" }]}
        actions={{ onRetry: vi.fn(), onUpdate }}
      />,
    );
    expect(screen.getByRole("button", { name: "注文1のラーメンの調理を開始" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文1の餃子の調理を開始" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "注文2のラーメンを完成" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "注文1の餃子の調理を開始" }));
    expect(onUpdate).toHaveBeenCalledWith(
      kitchenPageFixture.orders[0],
      kitchenPageFixture.orders[0]!.lines[1],
      "cooking",
    );
  });
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

  it("未調理は着手でき、調理中は確認後の完成または着手取消だけを選べる", async () => {
    const onUpdate = vi.fn();
    render(<KitchenPageUI {...kitchenPageFixture} actions={{ onRetry: vi.fn(), onUpdate }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文1のラーメンの調理を開始" }));
    expect(onUpdate).toHaveBeenCalledWith(
      kitchenPageFixture.orders[0],
      kitchenPageFixture.orders[0]!.lines[0],
      "cooking",
    );
    fireEvent.click(screen.getByRole("button", { name: "注文2のラーメンを完成" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const dialog = await screen.findByRole("dialog", { name: "完成にしてよいですか？" });
    expect(within(dialog).getByText("注文2：ラーメン × 2個")).toBeDefined();
    expect(within(dialog).getByText("完成にすると、未調理・調理中には戻せません。")).toBeDefined();
    const confirm = within(dialog).getByRole("button", { name: "はい、完成にする" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith(
      kitchenPageFixture.orders[1],
      kitchenPageFixture.orders[1]!.lines[0],
      "completed",
    );
    fireEvent.click(screen.getByRole("button", { name: "注文2のラーメンを未調理に戻す" }));
    expect(onUpdate).toHaveBeenLastCalledWith(
      kitchenPageFixture.orders[1],
      kitchenPageFixture.orders[1]!.lines[0],
      "unstarted",
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "対応済みを非表示" }));
    expect(within(screen.getByRole("article", { name: "注文3" })).queryByRole("button")).toBeNull();
  });
  it.each(["キャンセル", "確認を閉じる"])("完成の確認で「%s」を選んでも更新しない", async (name) => {
    const onUpdate = vi.fn();
    render(<KitchenPageUI {...kitchenPageFixture} actions={{ onRetry: vi.fn(), onUpdate }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文2のラーメンを完成" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name }));
    expect(onUpdate).not.toHaveBeenCalled();
  });
  it.each([{ loading: true }, { failed: true }, { pendingLines: [{ orderId: "order-2", menuItemId: "ramen" }] }])(
    "完成の確認中に更新不可になったら送信を止める: %o",
    async (state) => {
      const onUpdate = vi.fn();
      const props = { ...kitchenPageFixture, actions: { onRetry: vi.fn(), onUpdate } };
      const page = render(<KitchenPageUI {...props} />);
      fireEvent.click(screen.getByRole("button", { name: "注文2のラーメンを完成" }));
      await screen.findByRole("dialog");
      page.rerender(<KitchenPageUI {...props} {...state} />);
      const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "はい、完成にする" });
      expect(confirm.hasAttribute("disabled")).toBe(true);
      fireEvent.click(confirm);
      expect(onUpdate).not.toHaveBeenCalled();
    },
  );
  it("確認中に他の担当者が着手を取り消したら確認を閉じ、再着手しても再承認を求める", async () => {
    const onUpdate = vi.fn();
    const props = { ...kitchenPageFixture, actions: { onRetry: vi.fn(), onUpdate } };
    const page = render(<KitchenPageUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "注文2のラーメンを完成" }));
    await screen.findByRole("dialog");
    const orders = props.orders.map((order) => ({
      ...order,
      lines: order.lines.map((line) => ({ ...line, cookingState: "unstarted" as const })),
    }));
    page.rerender(<KitchenPageUI {...props} orders={orders} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    page.rerender(<KitchenPageUI {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onUpdate).not.toHaveBeenCalled();
  });
  it.each([{ loading: true }, { failed: true }, { pendingLines: [{ orderId: "order-1", menuItemId: "ramen" }] }])(
    "取得中・取得失敗・保存中は更新を止める: %o",
    (state) => {
      render(<KitchenPageUI {...kitchenPageFixture} {...state} />);
      expect(screen.getByRole("button", { name: "注文1のラーメンの調理を開始" }).hasAttribute("disabled")).toBe(true);
    },
  );
  it("受け渡し済みの注文は調理状況を変更できない", () => {
    const order = { ...kitchenPageFixture.orders[1]!, handedOffAt: "2026-10-24T02:00:00.000Z" };
    render(<KitchenPageUI {...kitchenPageFixture} orders={[order]} />);
    expect(within(screen.getByRole("article", { name: "注文2" })).queryByRole("button")).toBeNull();
  });
  it("権限のない利用者には注文内容を出さない", () => {
    render(<KitchenPageUI {...kitchenPageFixture} access="denied" />);
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("スタッフ権限");
  });
  it("取得失敗を注文なしと誤表示せず、再試行を提供する", () => {
    const onRetry = vi.fn();
    render(<KitchenPageUI {...kitchenPageFixture} orders={[]} failed actions={{ onRetry, onUpdate: vi.fn() }} />);
    expect(screen.queryByText("表示する注文はありません。")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "商品情報を更新" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
