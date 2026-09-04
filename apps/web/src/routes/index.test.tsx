import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../test/render";
import { Route } from "./index";

describe("公開ページ", () => {
  it("店名を表示する", () => {
    const Home = Route.options.component;

    if (!Home) {
      throw new Error("経路に画面が設定されていない");
    }

    render(<Home />);

    expect(screen.getByRole("heading", { name: "猫耳メイドラーメン" })).toBeDefined();
  });
});
