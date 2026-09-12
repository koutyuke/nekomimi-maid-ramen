import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { handoffPageFixture } from "../../testing";
import { HandoffPageUI } from "./handoff-page.ui";

describe("SPEC-HAND-001 SPEC-HAND-002 SPEC-HAND-003 受け渡し一覧", () => {
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

  it("全商品が揃った注文だけを受け渡せる", () => {
    const onComplete = vi.fn();
    render(<HandoffPageUI {...handoffPageFixture} actions={{ ...handoffPageFixture.actions, onComplete }} />);
    expect(screen.getByText("ラーメン × 2")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "注文1を受け渡し済みにする" }));
    expect(onComplete).toHaveBeenCalledWith(handoffPageFixture.orders[0]);
    expect(screen.queryByRole("button", { name: "注文2を受け渡し済みにする" })).toBeNull();
  });

  it("完了した注文は表示しても操作できない", () => {
    render(<HandoffPageUI {...handoffPageFixture} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "完了を非表示" }));
    expect(within(screen.getByRole("article", { name: "注文4" })).queryByRole("button")).toBeNull();
  });

  it.each([{ connected: false }, { failed: true }, { pending: true }, { loading: true }])(
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
