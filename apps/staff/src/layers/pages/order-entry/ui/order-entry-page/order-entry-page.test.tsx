import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { TestWebSocket } from "../../../../../testing/websocket";
import { menuFixture } from "../../../../entities/menu/testing";
import { OrderEntryPage } from "./order-entry-page";

let role = "Staff";
let requests: unknown[] = [];
let outcome = "success";
let menuRequests = 0;
let price = 500;
let stock = 30;
let menuFailed = false;
let revision = 1;
let release: (() => void) | undefined;

beforeEach(() => {
  role = "Staff";
  requests = [];
  outcome = "success";
  menuRequests = 0;
  price = 500;
  stock = 30;
  menuFailed = false;
  revision = 1;
  release = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        return Response.json({ staff: { id: "staff", name: "担当者", email: "staff@example.com", role } });
      }
      if (url.endsWith("/staff/menu/revision")) {
        return Response.json({ revision });
      }
      if (url.endsWith("/staff/menu")) {
        menuRequests += 1;
        if (menuFailed) {
          return Response.json({}, { status: 500 });
        }
        return Response.json({
          revision,
          items: menuFixture.map((item) =>
            item.id === "item-ramen" ? Object.assign({}, item, { price, quantity: stock, sellable: stock > 0 }) : item,
          ),
        });
      }
      if (url.endsWith("/staff/orders")) {
        if (typeof init?.body !== "string") {
          throw new Error("Expected JSON body");
        }
        requests.push(JSON.parse(init.body));
        if (outcome === "pending") {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        }
        if (outcome === "network") {
          throw new Error("offline");
        }
        if (outcome === "shortage") {
          return Response.json(
            { code: "out_of_stock", shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }] },
            { status: 409 },
          );
        }
        if (outcome === "forbidden") {
          return Response.json({ message: "PRIVATE_ERROR" }, { status: 403 });
        }
        return Response.json(
          {
            orderId: "order",
            businessDate: "2026-10-30",
            orderNumber: 42,
            totalAmount: 1000,
            cookingState: "unstarted",
            lines: [{ menuItemId: "item-ramen", quantity: 2, unitPrice: 500, subtotal: 1000 }],
          },
          { status: 201 },
        );
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
const open = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <OrderEntryPage />
    </QueryClientProvider>,
  );
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const prepare = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "ラーメンを1個増やす" }));
  click("ラーメンを1個増やす");
  click("+1,000円");
  click("+1,000円");
};

describe("SPEC-SAL-001〜005 / SPEC-INV-001〜002 注文・会計", () => {
  it("確認中に商品取得が失敗したら、キャッシュが残っていても承認を止める", async () => {
    open();
    await prepare();
    click("注文を確定");
    const dialog = await screen.findByRole("dialog", { name: "注文を確定してよいですか？" });
    menuFailed = true;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await screen.findByText("商品情報を取得できません。再読み込みしてから確定してください。");
    expect(screen.getAllByText("合計：1,000円").length).toBeGreaterThan(0);
    const confirm = within(dialog).getByRole("button", { name: "はい、確定する" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    fireEvent.click(confirm);
    expect(requests).toEqual([]);
  });

  it("残数が減っても選択数と受取金額を保ち、不足理由を表示して確定を止める", async () => {
    open();
    await prepare();
    const before = menuRequests;
    stock = 1;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await screen.findByText("ラーメン：希望2個／販売可能1個");
    expect(screen.getByText("/ 1(1)")).toBeDefined();
    expect(screen.getByLabelText("ラーメンの選択数").textContent).toContain("2");
    expect(screen.getByText("合計：1,000円")).toBeDefined();
    expect(screen.getByText("お釣り：1,000円")).toBeDefined();
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
    expect(requests).toEqual([]);
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    expect(menuRequests).toBe(before + 1);
  });

  it("販売可否が変わらない在庫減算も反映し、売り切れからの再開を表示する", async () => {
    open();
    await prepare();
    stock = 5;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await screen.findByText("/ 5(5)");
    stock = 0;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true),
    );
    stock = 10;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(false),
    );
    expect(screen.getByText("/ 10(10)")).toBeDefined();
  });

  it("結果不明の間に在庫が減っても、元の要求識別子と内容で結果を再確認する", async () => {
    outcome = "network";
    open();
    await prepare();
    click("注文を確定");
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByRole("button", { name: "同じ注文の結果を再確認" });
    stock = 0;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    // 最初から売り切れの餃子に加え、ラーメンにも売り切れが反映される。
    await waitFor(() => expect(screen.getAllByText("売り切れ")).toHaveLength(2));
    outcome = "success";
    click("同じ注文の結果を再確認");
    await screen.findByText("注文番号：42");
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(requests[1]);
  });

  it("候補の追加・変更・削除で金額を計算し、画面を離れるまで確定要求を送らない", async () => {
    const page = open();
    await prepare();
    fireEvent.click(screen.getByRole("button", { name: "コーラを1個増やす" }));
    expect(screen.getByText("合計：1,300円")).toBeDefined();
    expect(screen.getByText("お釣り：700円")).toBeDefined();
    expect(screen.getByText("小計：1,000円")).toBeDefined();
    expect(screen.getByRole("button", { name: "餃子を1個増やす" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "コーラを1個減らす" }));
    expect(screen.getByText("合計：1,000円")).toBeDefined();
    page.unmount();
    expect(requests).toEqual([]);
  });
  it("送信後の価格更新は結果確認中の候補へ反映せず、次の注文から使う", async () => {
    outcome = "pending";
    open();
    await prepare();
    click("注文を確定");
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await waitFor(() => expect(requests).toHaveLength(1));
    const before = menuRequests;
    price = 1200;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ menu: revision }));
    await waitFor(() => expect(menuRequests).toBeGreaterThan(before));
    outcome = "network";
    release?.();
    await screen.findByRole("button", { name: "同じ注文の結果を再確認" });
    expect(screen.getAllByText("合計：1,000円").length).toBeGreaterThan(0);
    expect(screen.queryByText("合計：2,400円")).toBeNull();
    expect(screen.getAllByText("お釣り：1,000円").length).toBeGreaterThan(0);
    outcome = "success";
    click("同じ注文の結果を再確認");
    await screen.findByText("注文番号：42");
    expect(requests[1]).toEqual(requests[0]);
    click("番号を控えて次の注文");
    click("ラーメンを1個増やす");
    expect(screen.getByText("合計：1,200円")).toBeDefined();
  });
  it.each([
    { stock: 3, limit: 3, total: "1,500円" },
    { stock: 30, limit: 10, total: "5,000円" },
  ])("在庫$stock個のとき数量ボタンで0〜$limit個を選び、範囲外に進めない", async (scenario) => {
    stock = scenario.stock;
    open();
    await prepare();
    for (let count = 0; count < 12; count += 1) {
      click("ラーメンを1個増やす");
    }
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("ラーメンの選択数").textContent).toBe(String(scenario.limit));
    expect(screen.getByText(`合計：${scenario.total}`)).toBeDefined();
    for (let count = 0; count < 12; count += 1) {
      click("ラーメンを1個減らす");
    }
    expect(screen.getByRole("button", { name: "ラーメンを1個減らす" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("ラーメンの選択数").textContent).toBe("0");
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByRole("textbox")).toBeNull();
  });
  it("末尾00を補うテンキーと加算ボタンで受取金額を入力できる", async () => {
    open();
    await prepare();
    click("クリア");
    click("受取金額に5を入力");
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
    click("受取金額に0を入力");
    expect(screen.getByText("お釣り：4,000円")).toBeDefined();
    click("1桁削除");
    click("+500円");
    expect(screen.getByText("お釣り：0円")).toBeDefined();
    click("クリア");
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
  it("確認ダイアログでは送信せず、戻って内容を修正してから承認できる", async () => {
    open();
    await prepare();
    click("注文を確定");
    const confirmation = await screen.findByRole("dialog", { name: "注文を確定してよいですか？" });
    expect(within(confirmation).getByText("ラーメン × 2個")).toBeDefined();
    expect(within(confirmation).getByText("合計：1,000円")).toBeDefined();
    expect(requests).toHaveLength(0);
    click("入力に戻る");
    click("ラーメンを1個減らす");
    click("注文を確定");
    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(requests).toHaveLength(0);
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("注文番号：42");
    expect(requests).toEqual([expect.objectContaining({ lines: [{ menuItemId: "item-ramen", quantity: 1 }] })]);
  });
  it("確定ダイアログを閉じても前回の注文番号と内容を再表示できる", async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    open();
    await prepare();
    click("注文を確定");
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("注文番号：42");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("注文番号：42")).toBeDefined();
    expect(scrollTo).not.toHaveBeenCalled();
    click("閉じる");
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: "smooth" });
    click("コーラを1個増やす");
    click("前回の注文を確認");
    const previous = await screen.findByRole("dialog");
    expect(within(previous).getByText("注文番号：42")).toBeDefined();
    expect(within(previous).getByText("ラーメン × 2個")).toBeDefined();
    expect(requests).toHaveLength(1);
    click("閉じる");
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(screen.getByText("合計：300円")).toBeDefined();
  });
  it("在庫不足の詳細を表示し、個数を修正して新しい要求で確定できる", async () => {
    outcome = "shortage";
    open();
    await prepare();
    fireEvent.click(screen.getByRole("button", { name: "注文を確定" }));
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("ラーメン：希望2個／販売可能1個");
    click("ラーメンを1個減らす");
    outcome = "success";
    fireEvent.click(screen.getByRole("button", { name: "注文を確定" }));
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("注文番号：42");
    expect(requests).toHaveLength(2);
    expect(requests[0]).not.toEqual(requests[1]);
    expect(menuRequests).toBeGreaterThan(1);
  });
  it("送信中もダイアログを閉じず、同じダイアログで注文番号へ切り替える", async () => {
    outcome = "pending";
    open();
    await prepare();
    click("注文を確定");
    const dialog = await screen.findByRole("dialog", { name: "注文を確定してよいですか？" });
    fireEvent.click(within(dialog).getByRole("button", { name: "はい、確定する" }));
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(within(dialog).getByRole("button", { name: "入力に戻る" }).hasAttribute("disabled")).toBe(true);
    outcome = "success";
    release?.();
    await screen.findByText("注文番号：42");
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
  it("連打を一要求にまとめ、応答喪失時は内容を固定して同じ要求を再送する", async () => {
    outcome = "pending";
    open();
    await prepare();
    click("注文を確定");
    const confirm = await screen.findByRole("button", { name: "はい、確定する" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(requests).toHaveLength(1));
    outcome = "network";
    release?.();
    await screen.findByRole("button", { name: "同じ注文の結果を再確認" });
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    outcome = "forbidden";
    fireEvent.click(screen.getByRole("button", { name: "同じ注文の結果を再確認" }));
    await screen.findByText("ログイン状態とスタッフ権限を確認してください。");
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    outcome = "success";
    fireEvent.click(screen.getByRole("button", { name: "同じ注文の結果を再確認" }));
    await screen.findByText("注文番号：42");
    expect(requests).toHaveLength(3);
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[0]).toEqual(requests[2]);
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
    click("注文を確定");
    expect(requests).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "番号を控えて次の注文" }));
    expect(screen.getByLabelText("ラーメンの選択数").textContent).toBe("0");
    expect(screen.getByRole("status", { name: "受取金額" }).textContent).toBe("—00 円");
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
  it("商品情報を更新した価格で再計算し、受取金額が不足すれば確定を止める", async () => {
    open();
    await prepare();
    price = 1200;
    fireEvent.click(screen.getByRole("button", { name: "商品情報を更新" }));
    await screen.findByText("合計：2,400円");
    expect(screen.getByRole("button", { name: "注文を確定" }).hasAttribute("disabled")).toBe(true);
  });
  it("Noneには会計操作を表示しない", async () => {
    role = "None";
    open();
    await screen.findByText("注文・会計にはスタッフ権限が必要です。");
    expect(screen.queryByRole("button", { name: "注文を確定" })).toBeNull();
    expect(menuRequests).toBe(0);
  });
  it("権限エラーを成功扱いにせず内部情報を表示しない", async () => {
    outcome = "forbidden";
    open();
    await prepare();
    fireEvent.click(screen.getByRole("button", { name: "注文を確定" }));
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("ログイン状態とスタッフ権限を確認してください。");
    expect(screen.queryByText("注文番号：42")).toBeNull();
    expect(screen.queryByText("PRIVATE_ERROR")).toBeNull();
  });
});
