import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render-ui";
import { handoffPageFixture, handoffOrdersFixture } from "../testing";
import { HandoffPageUI } from "./handoff-page.ui";
import type { HandoffPageUIProps } from "./handoff-page.ui";

describe("SPEC-HAND-001 SPEC-HAND-002 SPEC-HAND-003 受け渡し一覧", () => {
  it("アクセス拒否中も再取得でき、復帰後も表示設定を維持する", () => {
    const onRetry = vi.fn();
    const props = { ...handoffPageFixture, onRetry };
    const page = render(<HandoffPageUI {...props} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
    page.rerender(<HandoffPageUI {...props} orders={{ status: "denied", data: undefined }} />);
    expect(screen.queryByRole("article")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "注文情報を更新" }));
    expect(onRetry).toHaveBeenCalledOnce();
    page.rerender(<HandoffPageUI {...props} />);
    expect(screen.getByRole("article", { name: "注文4" })).toBeDefined();
  });
  it("保存中のドリンクだけを無効にし、別注文の受け渡しを止めない", () => {
    render(<HandoffPageUI {...handoffPageFixture} pendingLines={[{ orderId: "order-2", menuItemId: "cola" }]} />);
    expect(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }).hasAttribute("disabled")).toBe(false);
  });
  it("完成した表示になっても、その注文の更新確認が終わるまで受け渡しを止める", () => {
    render(<HandoffPageUI {...handoffPageFixture} pendingLines={[{ orderId: "order-1", menuItemId: "tea" }]} />);
    expect(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }).hasAttribute("disabled")).toBe(false);
  });
  it("状態とドリンク対応状況で並べ、完了を初期表示しない", () => {
    render(<HandoffPageUI {...handoffPageFixture} />);
    expect(screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"))).toEqual([
      "注文1",
      "注文2",
      "注文3",
    ]);
    expect(screen.queryByRole("article", { name: "注文4" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
    expect(screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"))).toEqual([
      "注文1",
      "注文2",
      "注文3",
      "注文4",
    ]);
  });

  it("ドリンクだけを更新できる", () => {
    const onUpdate = vi.fn();
    render(<HandoffPageUI {...handoffPageFixture} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }));
    expect(onUpdate).toHaveBeenCalledWith("order-2", "cola", "cooking");
    expect(
      within(screen.getByRole("article", { name: "注文2" })).queryByRole("button", { name: /ラーメン/ }),
    ).toBeNull();
    expect(within(screen.getByRole("article", { name: "注文3" })).queryByRole("button")).toBeNull();
  });

  it("全商品が揃った注文だけを確認後に受け渡せる", async () => {
    const onComplete = vi.fn();
    render(<HandoffPageUI {...handoffPageFixture} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }));
    expect(onComplete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", { name: "受け渡しを完了してよいですか？" });
    expect(within(dialog).getByText("注文1")).toBeDefined();
    expect(within(dialog).getByText("ラーメン × 2個")).toBeDefined();
    expect(within(dialog).getByText("烏龍茶 × 1個")).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "はい、受け渡しを完了する" }));
    expect(onComplete).toHaveBeenCalledWith("order-1");
    expect(screen.queryByRole("button", { name: "注文2を受け渡し済みにする" })).toBeNull();
  });

  it("完了した注文は表示しても操作できない", () => {
    render(<HandoffPageUI {...handoffPageFixture} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
    expect(within(screen.getByRole("article", { name: "注文4" })).queryByRole("button")).toBeNull();
  });

  it.each([{ orders: { status: "error" as const, data: handoffOrdersFixture } }, { handoffPending: true }])(
    "最新の状態を確認できない間は更新も受け渡しもできない: %o",
    (state) => {
      render(<HandoffPageUI {...handoffPageFixture} {...state} />);
      expect(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }).hasAttribute("disabled")).toBe(true);
      expect(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }).hasAttribute("disabled")).toBe(true);
    },
  );

  it("取得失敗を注文なしと誤表示しない", () => {
    render(<HandoffPageUI {...handoffPageFixture} orders={{ status: "error", data: undefined }} />);
    expect(screen.queryByText("表示する注文はありません。")).toBeNull();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("WebSocketだけの切断では更新操作を止めず、取得失敗や拒否は接続中と表示しない", () => {
    const actions = { onUpdate: vi.fn(), onComplete: vi.fn(), onRetry: vi.fn() };
    const props = { ...handoffPageFixture, realtimeConnected: false, ...actions };
    const page = render(<HandoffPageUI {...props} />);
    expect(screen.getByText("接続中")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }));
    expect(actions.onUpdate).toHaveBeenCalledWith("order-2", "cola", "cooking");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "注文1を受け渡し済みにする" }).disabled).toBe(false);
    page.rerender(<HandoffPageUI {...props} orders={{ status: "error", data: handoffOrdersFixture }} />);
    expect(screen.queryByText("接続中")).toBeNull();
    page.rerender(<HandoffPageUI {...props} orders={{ status: "denied", data: undefined }} />);
    expect(screen.queryByText("接続中")).toBeNull();
  });

  it("ドリンクと受け渡しの失敗を両方表示し、アクセス拒否中は隠す", () => {
    const props = { ...handoffPageFixture, cookingError: "ドリンク更新に失敗", handoffError: "受け渡し記録に失敗" };
    const page = render(<HandoffPageUI {...props} />);
    expect(screen.getByText(props.cookingError)).toBeDefined();
    expect(screen.getByText(props.handoffError)).toBeDefined();
    page.rerender(<HandoffPageUI {...props} orders={{ status: "denied", data: undefined }} />);
    expect(screen.queryByText(props.cookingError)).toBeNull();
    expect(screen.queryByText(props.handoffError)).toBeNull();
  });
});

describe.each([
  { action: "ドリンクの完成", trigger: "注文2のコーラを完成", confirm: "はい、完成にする" },
  { action: "受け渡し完了", trigger: "注文1を受け渡し済みにする", confirm: "はい、受け渡しを完了する" },
])("SPEC-HAND-002 SPEC-HAND-003 $actionの確認", ({ action, trigger, confirm }) => {
  const openConfirmation = async () => {
    const actions = { onUpdate: vi.fn(), onComplete: vi.fn(), onRetry: vi.fn() };
    const props: HandoffPageUIProps = {
      ...handoffPageFixture,
      orders: {
        status: "success",
        data: handoffOrdersFixture.map((order) =>
          order.id === "order-2"
            ? Object.assign({}, order, {
                lines: order.lines.map((line) => Object.assign({}, line, { cookingState: "cooking" as const })),
              })
            : order,
        ),
      },
      ...actions,
    };
    const page = render(<HandoffPageUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: trigger }));
    const dialog = await screen.findByRole("dialog");
    return { page, props, dialog, actions };
  };

  it("承認するまで送信せず、承認を連打しても一度だけ実行する", async () => {
    const { dialog, actions } = await openConfirmation();
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
    const button = within(dialog).getByRole("button", { name: confirm });
    fireEvent.click(button);
    fireEvent.click(button);
    if (action === "ドリンクの完成") {
      expect(within(dialog).getByText("注文2：コーラ × 1個")).toBeDefined();
      expect(actions.onUpdate).toHaveBeenCalledExactlyOnceWith("order-2", "cola", "completed");
      expect(actions.onComplete).not.toHaveBeenCalled();
    } else {
      expect(actions.onComplete).toHaveBeenCalledExactlyOnceWith("order-1");
      expect(actions.onUpdate).not.toHaveBeenCalled();
    }
  });

  it.each(["キャンセル", "確認を閉じる"])("「%s」では送信しない", async (name) => {
    const { dialog, actions } = await openConfirmation();
    fireEvent.click(within(dialog).getByRole("button", { name }));
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });

  it.each(["pending", "denied"] as const)(
    "取得状態が%sになったら確認を閉じ、復帰後も再承認を求める",
    async (status) => {
      const { page, props, actions } = await openConfirmation();
      page.rerender(<HandoffPageUI {...props} orders={{ status, data: undefined }} />);
      expect(screen.queryByRole("article")).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.queryByText("表示する注文はありません。")).toBeNull();
      page.rerender(<HandoffPageUI {...props} />);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(actions.onUpdate).not.toHaveBeenCalled();
      expect(actions.onComplete).not.toHaveBeenCalled();
    },
  );

  it.each(["error", "handoffPending"] as const)("確認中に更新不可になったら承認を止める: %o", async (state) => {
    const { page, props, actions } = await openConfirmation();
    page.rerender(
      <HandoffPageUI
        {...props}
        orders={state === "error" ? { status: "error", data: props.orders.data } : props.orders}
        handoffPending={state === "handoffPending"}
      />,
    );
    const button = within(screen.getByRole("dialog")).getByRole("button", { name: confirm });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });

  it("確認中に商品の状態が変わったら閉じ、状態が戻っても再承認を求める", async () => {
    const { page, props, actions } = await openConfirmation();
    page.rerender(
      <HandoffPageUI
        {...props}
        orders={{
          status: "success",
          data: props.orders.data!.map((order) =>
            Object.assign({}, order, {
              lines: order.lines.map((line) => Object.assign({}, line, { cookingState: "unstarted" as const })),
            }),
          ),
        }}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    page.rerender(<HandoffPageUI {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });

  it.each(["handedOffAt", "cancelledAt"] as const)("確認中に注文が更新されたら閉じる: %s", async (field) => {
    const { page, props, actions } = await openConfirmation();
    page.rerender(
      <HandoffPageUI
        {...props}
        orders={{
          status: "success",
          data: props.orders.data!.map((order) =>
            Object.assign({}, order, {
              [field]: "2026-10-24T02:00:00.000Z",
            }),
          ),
        }}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });
});
