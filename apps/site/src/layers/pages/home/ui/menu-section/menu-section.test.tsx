import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MENU_ITEMS } from "../../model/menu";
import { MenuSection } from "./menu-section";

describe("SPEC-VIS-002 メニューを表示する", () => {
  it("APIを使わずに、公開サイトの商品データの全商品を表示する", () => {
    render(<MenuSection />);
    for (const item of MENU_ITEMS) {
      expect(screen.getByRole("button", { name: new RegExp(item.name) })).toBeDefined();
    }
  });
});
