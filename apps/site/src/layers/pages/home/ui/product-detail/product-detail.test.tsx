import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { checkedRamenFixture, ramenFixture } from "../../testing/menu-fixtures";
import { ProductDetail } from "./product-detail";

describe("SPEC-VIS-004 商品に含まれる特定原材料を表示する", () => {
  it("確認済みの商品は9品目ごとに使用状況と記号の意味を表示する", () => {
    render(<ProductDetail item={checkedRamenFixture} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(screen.getByRole("listitem", { name: "小麦: 使用" })).toBeDefined();
    expect(screen.getByRole("listitem", { name: "乳: 可能性あり" })).toBeDefined();
    expect(screen.getByRole("listitem", { name: "えび: 不使用" })).toBeDefined();
    expect(document.body.textContent).toContain("調理過程での接触及び、使用製品での含有の可能性があります");
  });

  it("未確認の商品は品目の一覧を出さず、確認中であることだけを表示する", () => {
    render(<ProductDetail item={{ ...ramenFixture, allergens: null }} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(document.body.textContent).toContain("確認中");
    expect(document.body.textContent).not.toContain("使用していません");
  });
});
