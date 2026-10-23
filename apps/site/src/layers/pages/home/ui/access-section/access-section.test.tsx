import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessSection } from "./access-section";

describe("SPEC-VIS-001 出店情報を表示する", () => {
  it("開催日・一般公開日・営業時間・注文受付の終了時刻・場所・雨天時の場所と、出店位置の地図を表示する", () => {
    render(<AccessSection />);
    const text = document.body.textContent;
    for (const expected of [
      "10/24(土)・25(日)",
      "一般公開は10/24(土)のみ",
      "9:00〜17:00",
      "ご注文は16:30まで",
      "茨城高専",
      "サッカー場",
      "雨天時は時計台周りのロータリーで開催します",
    ]) {
      expect(text).toContain(expected);
    }

    const map = screen.getByRole("figure", { name: /猫耳メイドラーメンのブース/ });
    for (const facility of ["サッカー", "グラウンド", "テニスコート", "工場", "体育館", "プール"]) {
      expect(within(map).getByText(facility)).toBeDefined();
    }
  });
});
