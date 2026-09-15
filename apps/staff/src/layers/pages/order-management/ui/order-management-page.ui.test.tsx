import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render-ui";
import { orderManagementPageFixture, orderManagementOrdersFixture } from "../testing";
import { OrderManagementPageUI } from "./order-management-page.ui";

const base = orderManagementOrdersFixture[0]!;
const orders = Array.from({ length: 42 }, (_, index) => ({
  ...base,
  id: `order-${index + 1}`,
  orderNumber: index + 1,
}));

describe("SPEC-SAL-006 注文一覧の表示とページ切り替え", () => {
  it("新しい順に20件ずつ表示し、再取得ではページを維持、日付変更では先頭へ戻す", () => {
    const view = render(
      <OrderManagementPageUI {...orderManagementPageFixture} orders={{ status: "success", data: orders }} />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(20);
    expect(within(rows[0]!).getByRole("button", { name: "注文42を取り消す" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    expect(screen.getByText("2 / 3 ページ")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文22を取り消す" })).toBeDefined();
    view.rerender(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        orders={{ status: "success", data: [...orders, { ...base, id: "new", orderNumber: 43 }] }}
      />,
    );
    expect(screen.getByText("2 / 3 ページ")).toBeDefined();
    fireEvent.change(screen.getByLabelText("営業日"), { target: { value: "2026-10-25" } });
    view.rerender(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        businessDate="2026-10-25"
        orders={{ status: "success", data: orders }}
      />,
    );
    expect(screen.getByText("1 / 3 ページ")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    view.rerender(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        businessDate="2026-10-25"
        orders={{ status: "success", data: orders.slice(0, 21) }}
      />,
    );
    expect(screen.getByText("2 / 2 ページ")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文1を取り消す" })).toBeDefined();
  });

  it("取消済み・完成・受け渡し済みを一覧に残し、理由と無効な取消ボタンを表示する", () => {
    render(
      <OrderManagementPageUI
        {...orderManagementPageFixture}
        orders={{
          status: "success",
          data: [
            { ...base, id: "cancelled", orderNumber: 1, cancelledAt: "2026-10-24T01:00:00Z" },
            { ...base, id: "handed-off", orderNumber: 2, handedOffAt: "2026-10-24T01:00:00Z" },
            { ...base, id: "completed", orderNumber: 3, lines: [{ ...base.lines[0]!, cookingState: "completed" }] },
          ],
        }}
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
    const props = { ...orderManagementPageFixture, onCancel };
    const view = render(<OrderManagementPageUI {...props} orders={{ status: "success", data: orders }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文42を取り消す" }));
    view.rerender(
      <OrderManagementPageUI
        {...props}
        orders={{ status: "success", data: [...orders, { ...base, id: "new", orderNumber: 43 }] }}
      />,
    );
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "はい、取り消す" }));
    expect(onCancel).toHaveBeenCalledExactlyOnceWith(orders[41]!.id);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("SPEC-SAL-006 取得状態と取消操作", () => {
  it.each(["pending", "denied"] as const)("%sでは確認を閉じ、回復後に勝手に開かない", async (status) => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const props = { ...orderManagementPageFixture, onCancel, onRetry };
    const view = render(<OrderManagementPageUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "注文12を取り消す" }));
    await screen.findByRole("dialog");
    view.rerender(<OrderManagementPageUI {...props} orders={{ status, data: undefined }} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("button", { name: "注文12を取り消す" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("営業日")).toBeDefined();
    view.rerender(<OrderManagementPageUI {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("取得失敗ではページと確認対象を保持して取消を止め、再取得後に同じ注文を取り消せる", async () => {
    const onCancel = vi.fn();
    const props = { ...orderManagementPageFixture, onCancel };
    const view = render(<OrderManagementPageUI {...props} orders={{ status: "success", data: orders }} />);
    fireEvent.click(screen.getByRole("button", { name: "次の20件" }));
    fireEvent.click(screen.getByRole("button", { name: "注文22を取り消す" }));
    await screen.findByRole("dialog");
    view.rerender(
      <OrderManagementPageUI {...props} orders={{ status: "error", data: orders }} realtimeConnected={false} />,
    );
    expect(screen.getByText("2 / 3 ページ")).toBeDefined();
    const confirm = screen.getByRole("button", { name: "はい、取り消す" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    fireEvent.click(confirm);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByText("接続中")).toBeNull();
    view.rerender(<OrderManagementPageUI {...props} orders={{ status: "success", data: orders }} />);
    fireEvent.click(screen.getByRole("button", { name: "はい、取り消す" }));
    expect(onCancel).toHaveBeenCalledExactlyOnceWith("order-22");
  });

  it("取消処理中は取消・日付変更・再読み込みを止める", () => {
    render(<OrderManagementPageUI {...orderManagementPageFixture} cancellationPending />);
    expect(screen.getByLabelText("営業日").hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "再読み込み" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文12を取り消す" }).hasAttribute("disabled")).toBe(true);
  });

  it("接続だけの切断では取消を続けられ、拒否時は取消結果を隠す", async () => {
    const onCancel = vi.fn();
    const props = { ...orderManagementPageFixture, onCancel, realtimeConnected: false };
    const view = render(<OrderManagementPageUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "注文12を取り消す" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "はい、取り消す" }));
    expect(onCancel).toHaveBeenCalledExactlyOnceWith(base.id);
    view.rerender(
      <OrderManagementPageUI
        {...props}
        orders={{ status: "denied", data: undefined }}
        cancellationError="取消エラー"
        cancelledOrderNumber={12}
      />,
    );
    expect(screen.queryByText("取消エラー")).toBeNull();
    expect(screen.queryByText(/在庫を戻しました/)).toBeNull();
    expect(screen.queryByText("接続中")).toBeNull();
  });
});
