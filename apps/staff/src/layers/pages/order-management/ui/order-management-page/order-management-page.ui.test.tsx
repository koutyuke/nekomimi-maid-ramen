import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { orderManagementPageFixture } from "../../testing";
import { OrderManagementPageUI } from "./order-management-page.ui";

const base = orderManagementPageFixture.orders[0]!;
const orders = Array.from({ length: 42 }, (_, index) => ({
  ...base,
  id: `order-${index + 1}`,
  orderNumber: index + 1,
}));

describe("SPEC-SAL-006 注文一覧の表示とページ切り替え", () => {
  it("新しい順に20件ずつ表示し、再取得ではページを維持、日付変更では先頭へ戻す", () => {
    const view = render(<OrderManagementPageUI {...orderManagementPageFixture} orders={orders} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(20);
    expect(within(rows[0]!).getByRole("button", { name: "注文42を取り消す" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    expect(screen.getByText("2 / 3 ページ")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文22を取り消す" })).toBeDefined();
    view.rerender(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        orders={[...orders, { ...base, id: "new", orderNumber: 43 }]}
      />,
    );
    expect(screen.getByText("2 / 3 ページ")).toBeDefined();
    fireEvent.change(screen.getByLabelText("営業日"), { target: { value: "2026-10-25" } });
    expect(screen.getByText("1 / 3 ページ")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    view.rerender(<OrderManagementPageUI {...orderManagementPageFixture} orders={orders.slice(0, 21)} />);
    expect(screen.getByText("2 / 2 ページ")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文1を取り消す" })).toBeDefined();
  });

  it("取消済み・完成・受け渡し済みを一覧に残し、理由と無効な取消ボタンを表示する", () => {
    render(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        orders={[
          { ...base, id: "cancelled", orderNumber: 1, cancelledAt: "2026-10-24T01:00:00Z" },
          { ...base, id: "handed-off", orderNumber: 2, handedOffAt: "2026-10-24T01:00:00Z" },
          { ...base, id: "completed", orderNumber: 3, lines: [{ ...base.lines[0]!, cookingState: "completed" }] },
        ]}
      />,
    );
    for (const reason of ["取消済み", "受け渡し済み", "完成した商品あり"]) {
      expect(screen.getByText(reason)).toBeDefined();
    }
    for (const id of [1, 2, 3]) {
      expect(screen.getByRole("button", { name: `注文${id}を取り消す` }).hasAttribute("disabled")).toBe(true);
    }
  });

  it("再取得で並びが変わっても確認対象を別の注文へ差し替えない", async () => {
    const onCancel = vi.fn();
    const props = { ...orderManagementPageFixture, actions: { ...orderManagementPageFixture.actions, onCancel } };
    const view = render(<OrderManagementPageUI {...props} orders={orders} />);
    fireEvent.click(screen.getByRole("button", { name: "注文42を取り消す" }));
    view.rerender(<OrderManagementPageUI {...props} orders={[...orders, { ...base, id: "new", orderNumber: 43 }]} />);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "はい、取り消す" }));
    expect(onCancel).toHaveBeenCalledExactlyOnceWith(orders[41]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
