import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { AuthGuard } from "../../../widgets/auth-guard";
import { InventoryManagementPage } from "./inventory-management-page";

let quantity = 8;
let revision = 1;
let menuFails = false;
let menuDenied = false;
let updateWait: Promise<void> | undefined;
let updateFails = false;
let role = "Admin";
let menuRequests = 0;

beforeEach(() => {
  quantity = 8;
  revision = 1;
  menuFails = false;
  menuDenied = false;
  updateWait = undefined;
  updateFails = false;
  role = "Admin";
  menuRequests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        return Response.json({
          staff: { id: "admin", name: "管理者", email: "admin@example.com", role },
        });
      }
      if (url.endsWith("/staff/menu/revision")) {
        return Response.json({ revision });
      }
      if (url.endsWith("/staff/menu")) {
        menuRequests += 1;
        if (menuDenied) {
          return new Response(null, { status: 403 });
        }
        if (menuFails) {
          return new Response(null, { status: 500 });
        }
        return Response.json({
          revision,
          items: [{ id: "ramen", name: "ラーメン", price: 500, sellable: quantity > 0, quantity }],
        });
      }
      if (url.endsWith("/staff/menu/ramen/stock") && init?.method === "PUT") {
        await updateWait;
        if (updateFails) {
          return new Response(null, { status: 403 });
        }
        if (typeof init.body !== "string") {
          throw new Error("Expected JSON body");
        }
        const body: unknown = JSON.parse(init.body);
        if (typeof body !== "object" || body === null || !("quantity" in body) || typeof body.quantity !== "number") {
          throw new Error("Expected quantity");
        }
        const previousQuantity = quantity;
        quantity = body.quantity;
        return Response.json({
          menuItemId: "ramen",
          previousQuantity,
          quantity,
          adjustedAt: new Date().toISOString(),
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <AuthGuard permission="Admin">
        <InventoryManagementPage />
      </AuthGuard>
    </QueryClientProvider>,
  );

describe("SPEC-INV-004 在庫管理画面", () => {
  it("数え直した現在数で在庫を上書きし、最新値を表示する", async () => {
    renderPage();

    fireEvent.change(await screen.findByRole("textbox", { name: "ラーメンの現在在庫数" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));

    await screen.findByText("ラーメンの在庫を8個から3個へ更新しました。");
    expect(quantity).toBe(3);
  });

  it("別端末の在庫変更通知を受けて現在数を更新する", async () => {
    renderPage();
    await screen.findByText("8個");

    quantity = 5;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));

    await screen.findByText("5個");
  });
  it("一覧の取得失敗後、再読み込みで在庫を表示できる", async () => {
    menuFails = true;
    renderPage();
    await screen.findByText("在庫を取得できません");
    expect(screen.queryByText("接続中")).toBeNull();
    expect(screen.queryByRole("table", { name: "商品別在庫" })).toBeNull();

    menuFails = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByText("8個");
  });

  it("更新が拒否されたときは在庫を変えず、再試行で0個に更新できる", async () => {
    updateFails = true;
    renderPage();
    fireEvent.change(await screen.findByRole("textbox", { name: "ラーメンの現在在庫数" }), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));
    await screen.findByText("在庫を更新できませんでした");
    expect(quantity).toBe(8);
    expect(screen.queryByText("在庫を更新しました")).toBeNull();

    updateFails = false;
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));
    await screen.findByText("ラーメンの在庫を8個から0個へ更新しました。");
    expect(quantity).toBe(0);
  });

  it("Staffには在庫一覧を取得・表示しない", async () => {
    role = "Staff";
    renderPage();
    await screen.findByText("このページを閲覧する権限がありません。");
    expect(menuRequests).toBe(0);
    expect(screen.queryByRole("table", { name: "商品別在庫" })).toBeNull();
  });
  it("取得を拒否されたら一覧を隠し、権限回復後の再読み込みで復旧できる", async () => {
    renderPage();
    await screen.findByText("8個");
    menuDenied = true;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    await screen.findByText("在庫情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。");
    expect(screen.queryByText("接続中")).toBeNull();
    expect(screen.queryByRole("table", { name: "商品別在庫" })).toBeNull();
    expect(screen.queryByText("在庫を読み込んでいます")).toBeNull();

    menuDenied = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByText("8個");
  });

  it("更新中は入力と再読み込みを無効にし、完了後に結果を表示する", async () => {
    let release: (() => void) | undefined;
    updateWait = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderPage();
    const input = await screen.findByRole("textbox", { name: "ラーメンの現在在庫数" });
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));

    await waitFor(() => expect(input.hasAttribute("disabled")).toBe(true));
    expect(screen.getByRole("button", { name: "再読み込み" }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("在庫を更新しました")).toBeNull();

    await act(async () => release?.());
    await screen.findByText("ラーメンの在庫を8個から2個へ更新しました。");
    expect(screen.getByRole("button", { name: "再読み込み" }).hasAttribute("disabled")).toBe(false);
  });
});

describe("SPEC-SYS-009 在庫管理の接続状態", () => {
  it("接続待ちと切断中に表示し、在庫更新を継続でき、再接続すると表示を消す", async () => {
    renderPage();
    await screen.findByText("8個");
    expect(screen.getByText("接続中")).toBeDefined();

    act(() => TestWebSocket.instances[0]!.open());
    expect(screen.queryByText("接続中")).toBeNull();

    act(() => TestWebSocket.instances[0]!.disconnect());
    expect(screen.getByText("接続中")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "ラーメンの現在在庫数" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ラーメンの在庫を更新" }));
    await screen.findByText("ラーメンの在庫を8個から3個へ更新しました。");
    expect(quantity).toBe(3);

    await waitFor(() => expect(TestWebSocket.instances.length).toBeGreaterThan(1), { timeout: 2500 });
    act(() => TestWebSocket.instances.at(-1)!.open());
    expect(screen.queryByText("接続中")).toBeNull();
  });
});
