import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { menuFixture } from "../../../entities/menu/testing";
import { OrderEntryPage } from "./order-entry-page";

let role = "Staff";
let requests: unknown[] = [];
let outcome = "success";
let menuRequests = 0;
let price = 500;
let release: (() => void) | undefined;

beforeEach(() => {
  role = "Staff";
  requests = [];
  outcome = "success";
  menuRequests = 0;
  price = 500;
  release = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/session")) {
        return Response.json({ staff: { id: "staff", name: "担当者", email: "staff@example.com", role } });
      }
      if (url.endsWith("/menu")) {
        menuRequests += 1;
        return Response.json({
          items: menuFixture.map((item) => (item.id === "item-ramen" ? Object.assign({}, item, { price }) : item)),
        });
      }
      if (url.endsWith("/orders")) {
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
  it("数量ボタンだけで0〜10個を選び、範囲外に進めない", async () => {
    open();
    await prepare();
    for (let count = 0; count < 12; count += 1) {
      click("ラーメンを1個増やす");
    }
    expect(screen.getByRole("button", { name: "ラーメンを1個増やす" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("合計：5,000円")).toBeDefined();
    for (let count = 0; count < 12; count += 1) {
      click("ラーメンを1個減らす");
    }
    expect(screen.getByRole("button", { name: "ラーメンを1個減らす" }).hasAttribute("disabled")).toBe(true);
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
    open();
    await prepare();
    click("注文を確定");
    fireEvent.click(await screen.findByRole("button", { name: "はい、確定する" }));
    await screen.findByText("注文番号：42");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("注文番号：42")).toBeDefined();
    click("閉じる");
    click("コーラを1個増やす");
    click("前回の注文を確認");
    const previous = await screen.findByRole("dialog");
    expect(within(previous).getByText("注文番号：42")).toBeDefined();
    expect(within(previous).getByText("ラーメン × 2個")).toBeDefined();
    expect(requests).toHaveLength(1);
    click("閉じる");
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
    expect(screen.queryByRole("button", { name: "注文を確定" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "番号を控えて次の注文" }));
    expect(screen.queryByRole("textbox", { name: "ラーメンの個数" })).toBeNull();
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
