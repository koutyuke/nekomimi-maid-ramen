import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { staffQueries } from "../layers/entities/staff";
import { routeTree } from "../routeTree.gen";
import { render } from "./render";
import type { Staff } from "../layers/entities/staff";

let staff: Staff | null;
let sessionFails: boolean;
let logoutFails: boolean;
let sessionGate: Promise<void> | undefined;
let logoutGate: Promise<void> | undefined;

beforeEach(() => {
  staff = { id: "staff", name: "担当者", email: "staff@example.com", role: "Staff" };
  sessionFails = false;
  logoutFails = false;
  sessionGate = undefined;
  logoutGate = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        await sessionGate;
        return sessionFails
          ? Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 500 })
          : Response.json({ staff });
      }
      if (url.endsWith("/auth/logout")) {
        await logoutGate;
        if (logoutFails) {
          return Response.json({ message: "PRIVATE_INTERNAL_ERROR" }, { status: 500 });
        }
        staff = null;
        return Response.json({ success: true });
      }
      if (url.endsWith("/menu")) {
        return Response.json({ items: [], revision: 1 });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const open = (path = "/") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { client, router };
};

const openMenu = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "アカウントメニュー" }));
  return within(await screen.findByRole("dialog", { name: "アカウントメニュー" }));
};

describe("SPEC-SYS-005・SPEC-SYS-006 共通ヘッダーとアカウント操作", () => {
  it("ユーザー名の頭文字からメニューを開き、ログアウトはメニューだけに表示する", async () => {
    staff = { ...staff!, name: "猫田 まい" };
    open();
    const trigger = await screen.findByRole("button", { name: "アカウントメニュー" });
    await waitFor(() => expect(trigger.textContent).toBe("猫ま"));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(within(screen.getByRole("main")).queryByRole("button", { name: "ログアウト" })).toBeNull();
    const menu = await openMenu();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getByRole("button", { name: "ログアウト" })).toBeDefined();
    expect(within(menu.getByRole("region", { name: "ログイン中のスタッフ" })).queryByRole("button")).toBeNull();
  });

  it.each(["Owner", "Admin", "Staff", "None"] as const)(
    "%sのメニューとトップで同じアカウントと権限別リンクを表示する",
    async (role) => {
      staff = { ...staff!, role };
      open();
      const account = await screen.findByRole("region", { name: "ログイン中のスタッフ" });
      const accountText = account.textContent;
      const links = within(screen.getByRole("main"))
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"));
      const menu = await openMenu();
      expect(menu.getByRole("region", { name: "ログイン中のスタッフ" }).textContent).toBe(accountText);
      expect(menu.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(links);
      expect(menu.queryByRole("link", { name: "スタッフ管理" }) !== null).toBe(role === "Owner" || role === "Admin");
      expect(menu.queryByRole("link", { name: "注文・会計" }) !== null).toBe(role !== "None");
    },
  );

  it("権限の再確認中もメニューを保ち、最新の氏名・メール・権限をトップとメニューへ反映する", async () => {
    const { client } = open();
    await screen.findByRole("region", { name: "ログイン中のスタッフ" });
    const menu = await openMenu();
    let release!: () => void;
    sessionGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    staff = { ...staff!, name: "管理者", email: "admin@example.com", role: "Admin" };
    await act(async () => {
      void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
    });
    expect(client.isFetching({ queryKey: staffQueries.current().queryKey })).toBe(1);
    expect(menu.getByRole("button", { name: "ログアウト" }).hasAttribute("disabled")).toBe(false);
    await act(async () => release());
    await menu.findByRole("link", { name: "スタッフ管理" });
    expect(menu.getByText("管理者")).toBeDefined();
    expect(menu.getByText("admin@example.com")).toBeDefined();
    fireEvent.click(menu.getByRole("button", { name: "メニューを閉じる" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("管理者")).toBeDefined();
    expect(screen.getByText("admin@example.com")).toBeDefined();
    expect(screen.getByRole("link", { name: "スタッフ管理" })).toBeDefined();
  });

  it("再確認失敗時はメニューを閉じ、共通の再試行で業務画面が回復しても閉じたままにする", async () => {
    const { client, router } = open("/sales");
    await screen.findByRole("heading", { name: "注文・会計" });
    await openMenu();
    sessionFails = true;
    await act(async () => {
      await client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
    });
    await screen.findByRole("button", { name: "再読み込み" });
    expect(screen.queryByRole("button", { name: "アカウントメニュー" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("heading", { name: "注文・会計" })).toBeNull();
    expect(screen.queryByText("PRIVATE_INTERNAL_ERROR")).toBeNull();
    expect(router.state.location.pathname).toBe("/sales");
    sessionFails = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByRole("heading", { name: "注文・会計" });
    expect(screen.getByRole("button", { name: "アカウントメニュー" })).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "アカウントメニュー" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("認証確認中はヘッダーとフッターを残し、業務データの取得は始めない", async () => {
    let release!: () => void;
    sessionGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    open("/sales");
    await screen.findByText("ログイン状態を確認しています");
    expect(screen.getByRole("link", { name: "Staff" })).toBeDefined();
    expect(screen.getByRole("contentinfo", { name: "規約とポリシー" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "アカウントメニュー" })).toBeNull();
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => (url instanceof Request ? url.url : String(url)).endsWith("/menu")),
    ).toBe(false);
    await act(async () => release());
    await screen.findByRole("heading", { name: "注文・会計" });
    expect(screen.getByRole("button", { name: "アカウントメニュー" })).toBeDefined();
  });

  it("未ログインの直接アクセスはトップへ戻り、ヘッダーとフッターを残す", async () => {
    staff = null;
    const { router } = open("/sales");
    await screen.findByRole("button", { name: "Googleでログイン" });
    expect(screen.getByRole("link", { name: "Staff" })).toBeDefined();
    expect(screen.getByRole("contentinfo", { name: "規約とポリシー" })).toBeDefined();
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("button", { name: "アカウントメニュー" })).toBeNull();
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => (url instanceof Request ? url.url : String(url)).endsWith("/menu")),
    ).toBe(false);
  });

  it("権限不足でもヘッダーを残し、トップへ移動できる", async () => {
    open("/staff-management");
    await screen.findByRole("alert", { name: "権限がありません" });
    expect(screen.getByRole("button", { name: "アカウントメニュー" })).toBeDefined();
    const menu = await openMenu();
    expect(menu.getByRole("button", { name: "ログアウト" })).toBeDefined();
    expect(menu.queryByRole("link", { name: "スタッフ管理" })).toBeNull();
    fireEvent.click(menu.getByRole("button", { name: "メニューを閉じる" }));
    fireEvent.click(await screen.findByRole("link", { name: "トップページへ戻る" }));
    await screen.findByRole("region", { name: "ログイン中のスタッフ" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("メニューを閉じてもログアウト中・失敗を保持し、再試行成功時だけ業務キャッシュを消す", async () => {
    const { client } = open();
    client.setQueryData(["private-orders"], [{ id: "sensitive-order" }]);
    await screen.findByRole("region", { name: "ログイン中のスタッフ" });
    let menu = await openMenu();
    let release!: () => void;
    logoutGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    logoutFails = true;
    fireEvent.click(menu.getByRole("button", { name: "ログアウト" }));
    await waitFor(() => expect(menu.getByRole("button", { name: "ログアウト" }).hasAttribute("disabled")).toBe(true));
    fireEvent.click(menu.getByRole("button", { name: "メニューを閉じる" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("button", { name: "ログアウト" })).toBeNull();
    menu = await openMenu();
    expect(menu.getByRole("button", { name: "ログアウト" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(menu.getByRole("button", { name: "メニューを閉じる" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await act(async () => release());
    expect(client.getQueryData(["private-orders"])).toBeDefined();
    menu = await openMenu();
    expect(menu.getByRole("alert").textContent).toContain("ログアウトできませんでした");
    logoutFails = false;
    fireEvent.click(menu.getByRole("button", { name: "ログアウト" }));
    await waitFor(() => expect(client.getQueryData(["private-orders"])).toBeUndefined());
    await screen.findByRole("button", { name: "Googleでログイン" });
    expect(screen.queryByRole("button", { name: "アカウントメニュー" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("現在のリンクにも移動先にも閉じる処理が働き、Staffからトップへ戻れる", async () => {
    const { router } = open("/sales");
    await screen.findByRole("heading", { name: "注文・会計" });
    let menu = await openMenu();
    const current = menu.getByRole("link", { name: "注文・会計" });
    expect(current.getAttribute("aria-current")).toBe("page");
    fireEvent.click(current);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("link", { name: "Staff" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    menu = await openMenu();
    fireEvent.click(menu.getByRole("link", { name: "注文・会計" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/sales"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
