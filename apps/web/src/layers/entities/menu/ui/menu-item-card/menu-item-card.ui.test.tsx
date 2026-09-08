import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../../../../testing/render";
import { menuItemFixture } from "../../testing/menu.fixtures";
import { MenuItemCardUI } from "./menu-item-card.ui";

describe("SPEC-VIS-004 商品に含まれる特定原材料を表示する", () => {
  it("含まれることを確認した品目を表示する", () => {
    render(
      <MenuItemCardUI
        item={menuItemFixture({
          allergenCheckState: "checked",
          containedAllergens: [
            { id: "allergen-wheat", name: "小麦" },
            { id: "allergen-egg", name: "卵" },
          ],
        })}
      />,
    );

    expect(screen.getByText("特定原材料: 小麦・卵")).toBeDefined();
  });

  it("含まないことを確認した商品では含まれない旨を表示する", () => {
    render(<MenuItemCardUI item={menuItemFixture({ allergenCheckState: "checked", containedAllergens: [] })} />);

    expect(screen.getByText("特定原材料: 含まれない")).toBeDefined();
  });

  it("未確認の商品では確認していないことが分かり、含まれない旨を表示しない", () => {
    render(<MenuItemCardUI item={menuItemFixture({ allergenCheckState: "unchecked", containedAllergens: [] })} />);

    expect(screen.getByText("特定原材料: 未確認")).toBeDefined();
    expect(screen.queryByText(/含まれない/)).toBeNull();
  });
});

describe("SPEC-VIS-002 メニューと販売可否を表示する", () => {
  it("在庫切れの商品を色以外の文字で識別できる", () => {
    render(<MenuItemCardUI item={menuItemFixture({ sellable: false })} />);

    expect(screen.getByText("売り切れ")).toBeDefined();
    expect(screen.queryByText("販売中")).toBeNull();
  });

  it("販売可能な商品を色以外の文字で識別できる", () => {
    render(<MenuItemCardUI item={menuItemFixture({ sellable: true })} />);

    expect(screen.getByText("販売中")).toBeDefined();
    expect(screen.queryByText("売り切れ")).toBeNull();
  });
});
