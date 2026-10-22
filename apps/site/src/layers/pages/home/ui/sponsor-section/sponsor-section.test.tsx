import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorSection } from "./sponsor-section";

describe("SPEC-VIS-003 承認されたスポンサー情報を表示する", () => {
  it("ご協賛にマルショウ、カナイの順でスポンサーページへのリンクを表示する", async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: SponsorSection }),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router} />);
    const section = await screen.findByRole("region", { name: "ご協賛" });
    const links = within(section).getAllByRole("link");
    expect(links).toEqual([
      within(section).getByRole("link", { name: "味噌乃マルショウ 那珂後台店" }),
      within(section).getByRole("link", { name: "イベントショップ カナイ" }),
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/sponsors/marushou", "/sponsors/kanai"]);
  });
});
