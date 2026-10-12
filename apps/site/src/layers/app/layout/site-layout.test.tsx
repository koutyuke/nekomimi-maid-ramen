import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routeTree } from "../../../routeTree.gen";

const renderSite = async (path = "/") => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
  render(<RouterProvider router={router} />);
  await screen.findByRole("banner");
  return router;
};

describe("SPEC-SYS-010 規約とポリシーへの導線", () => {
  it("トップのフッターからプライバシーポリシーと利用規約へ移動できる", async () => {
    await renderSite();
    const footer = within(screen.getByRole("navigation", { name: "フッター" }));
    expect(footer.getByRole("link", { name: "プライバシーポリシー" }).getAttribute("href")).toBe("/privacy");
    expect(footer.getByRole("link", { name: "利用規約" }).getAttribute("href")).toBe("/terms");
  });
});

describe("ハンバーガーメニュー", () => {
  it("ページ内リンクを選ぶとトップの区画へ移動して閉じ、開いたボタンへフォーカスを戻す", async () => {
    const router = await renderSite("/privacy");
    const trigger = screen.getByRole("button", { name: "メニューを開く" });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Coming soon")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("link", { name: "アクセス" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.hash).toBe("access");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "メニューを開く" }));
  });

  it("閉じるボタンで閉じる", async () => {
    await renderSite();
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "メニューを閉じる" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
