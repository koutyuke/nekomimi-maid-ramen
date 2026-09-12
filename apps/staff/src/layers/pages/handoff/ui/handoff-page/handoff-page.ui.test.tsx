import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { handoffPageFixture } from "../../testing";
import { HandoffPageUI } from "./handoff-page.ui";

describe("SPEC-HAND-001 SPEC-HAND-002 SPEC-HAND-003 受け渡し一覧", () => {
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
    render(<HandoffPageUI {...handoffPageFixture} actions={{ ...handoffPageFixture.actions, onUpdate }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }));
    expect(onUpdate).toHaveBeenCalledWith(
      handoffPageFixture.orders[1],
      handoffPageFixture.orders[1]!.lines[1],
      "cooking",
    );
    expect(
      within(screen.getByRole("article", { name: "注文2" })).queryByRole("button", { name: /ラーメン/ }),
    ).toBeNull();
    expect(within(screen.getByRole("article", { name: "注文3" })).queryByRole("button")).toBeNull();
  });

  it("全商品が揃った注文だけを確認後に受け渡せる", async () => {
    const onComplete = vi.fn();
    render(<HandoffPageUI {...handoffPageFixture} actions={{ ...handoffPageFixture.actions, onComplete }} />);
    fireEvent.click(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }));
    expect(onComplete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", { name: "受け渡しを完了してよいですか？" });
    expect(within(dialog).getByText("注文1")).toBeDefined();
    expect(within(dialog).getByText("ラーメン × 2個")).toBeDefined();
    expect(within(dialog).getByText("烏龍茶 × 1個")).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "はい、受け渡しを完了する" }));
    expect(onComplete).toHaveBeenCalledWith(handoffPageFixture.orders[0]);
    expect(screen.queryByRole("button", { name: "注文2を受け渡し済みにする" })).toBeNull();
  });

  it("完了した注文は表示しても操作できない", () => {
    render(<HandoffPageUI {...handoffPageFixture} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
    expect(within(screen.getByRole("article", { name: "注文4" })).queryByRole("button")).toBeNull();
  });

  it.each([{ failed: true }, { pending: true }, { loading: true }])(
    "最新の状態を確認できない間は更新も受け渡しもできない: %o",
    (state) => {
      render(<HandoffPageUI {...handoffPageFixture} {...state} />);
      expect(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }).hasAttribute("disabled")).toBe(true);
      expect(screen.getByRole("button", { name: "注文2のコーラの調理を開始" }).hasAttribute("disabled")).toBe(true);
    },
  );

  it("取得失敗を注文なしと誤表示しない", () => {
    render(<HandoffPageUI {...handoffPageFixture} orders={[]} failed />);
    expect(screen.queryByText("表示する注文はありません。")).toBeNull();
    expect(screen.getByRole("alert")).toBeDefined();
  });
});

describe.each([
  { action: "ドリンクの完成", trigger: "注文2のコーラを完成", confirm: "はい、完成にする" },
  { action: "受け渡し完了", trigger: "注文1を受け渡し済みにする", confirm: "はい、受け渡しを完了する" },
])("SPEC-HAND-002 SPEC-HAND-003 $actionの確認", ({ action, trigger, confirm }) => {
  const openConfirmation = async () => {
    const actions = { onUpdate: vi.fn(), onComplete: vi.fn(), onRetry: vi.fn() };
    const props = {
      ...handoffPageFixture,
      orders: handoffPageFixture.orders.map((order) =>
        order.id === "order-2"
          ? Object.assign({}, order, {
              lines: order.lines.map((line) => Object.assign({}, line, { cookingState: "cooking" as const })),
            })
          : order,
      ),
      actions,
    };
    const page = render(<HandoffPageUI {...props} />);
    fireEvent.click(screen.getByRole("button", { name: trigger }));
    const dialog = await screen.findByRole("dialog");
    return { page, props, dialog, actions };
  };

  it("承認するまで送信せず、承認を連打しても一度だけ実行する", async () => {
    const { dialog, actions, props } = await openConfirmation();
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
    const button = within(dialog).getByRole("button", { name: confirm });
    fireEvent.click(button);
    fireEvent.click(button);
    if (action === "ドリンクの完成") {
      expect(within(dialog).getByText("注文2：コーラ × 1個")).toBeDefined();
      expect(actions.onUpdate).toHaveBeenCalledExactlyOnceWith(props.orders[1], props.orders[1]!.lines[1], "completed");
      expect(actions.onComplete).not.toHaveBeenCalled();
    } else {
      expect(actions.onComplete).toHaveBeenCalledExactlyOnceWith(props.orders[0]);
      expect(actions.onUpdate).not.toHaveBeenCalled();
    }
  });

  it.each(["キャンセル", "確認を閉じる"])("「%s」では送信しない", async (name) => {
    const { dialog, actions } = await openConfirmation();
    fireEvent.click(within(dialog).getByRole("button", { name }));
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });

  it.each([{ loading: true }, { failed: true }, { pending: true }])(
    "確認中に更新不可になったら承認を止める: %o",
    async (state) => {
      const { page, props, actions } = await openConfirmation();
      page.rerender(<HandoffPageUI {...props} {...state} />);
      const button = within(screen.getByRole("dialog")).getByRole("button", { name: confirm });
      expect(button.hasAttribute("disabled")).toBe(true);
      fireEvent.click(button);
      expect(actions.onUpdate).not.toHaveBeenCalled();
      expect(actions.onComplete).not.toHaveBeenCalled();
    },
  );

  it("確認中に商品の状態が変わったら閉じ、状態が戻っても再承認を求める", async () => {
    const { page, props, actions } = await openConfirmation();
    page.rerender(
      <HandoffPageUI
        {...props}
        orders={props.orders.map((order) => ({
          ...order,
          lines: order.lines.map((line) => Object.assign({}, line, { cookingState: "unstarted" as const })),
        }))}
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
        orders={props.orders.map((order) =>
          Object.assign({}, order, {
            [field]: "2026-10-24T02:00:00.000Z",
          }),
        )}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actions.onUpdate).not.toHaveBeenCalled();
    expect(actions.onComplete).not.toHaveBeenCalled();
  });
});
