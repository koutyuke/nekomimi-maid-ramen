import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { menuFixture } from "../../../../entities/menu/testing";
import { MenuPageUI } from "./menu-page.ui";

const noop = () => {};

describe("SPEC-VIS-002 メニューと販売可否を表示する", () => {
  it("商品をAPIが返した表示順のまま、分類ごとにまとめて並べる", () => {
    render(<MenuPageUI actions={{ onRetry: noop }} failed={false} items={menuFixture} loading={false} />);

    const categories = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    const items = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

    expect(categories).toEqual(["ラーメン", "サイドメニュー", "ドリンク"]);
    expect(items).toEqual(["ラーメン", "餃子", "コーラ", "烏龍茶"]);
  });
});

describe("メニューを取得できないときの表示", () => {
  it("取得に失敗したとき、内部の情報を出さずに次の操作を案内する", () => {
    const onRetry = vi.fn();

    render(<MenuPageUI actions={{ onRetry }} failed items={[]} loading={false} />);

    expect(screen.getByText("メニューを表示できません。通信状況を確認して、もう一度お試しください。")).toBeDefined();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
