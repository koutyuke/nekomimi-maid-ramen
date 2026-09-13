import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render";
import { TestWebSocket } from "../../../../../testing/websocket";
import { orderManagementPageFixture } from "../../testing";
import { OrderManagementPage } from "./order-management-page";

const order = orderManagementPageFixture.orders[0]!;
let orders = [order];
let role = "Staff";
let failed = false;
let conflict = false;
let lostResponse = false;
let pendingResponse: Promise<void> | undefined;
let cancelled = 0;
let revision = 1;
const requests = vi.fn();

beforeEach(() => {
  orders = [order];
  role = "Staff";
  failed = false;
  conflict = false;
  lostResponse = false;
  pendingResponse = undefined;
  cancelled = 0;
  revision = 1;
  requests.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      requests(url, init?.method);
      if (url.endsWith("/auth/session")) {
        return Response.json({ staff: { id: "admin", name: "管理者", email: "admin@example.com", role } });
      }
      if (url.endsWith("/staff/orders/revision")) {
        return Response.json({ revision });
      }
      if (url.includes("/staff/orders?")) {
        return failed ? Response.json({}, { status: 500 }) : Response.json({ orders, revision });
      }
      if (url.endsWith("/staff/orders/order-1/cancel") && init?.method === "POST") {
        cancelled += 1;
        await pendingResponse;
        orders = [{ ...order, cancelledAt: new Date().toISOString() }];
        revision += 1;
        if (lostResponse) {
          throw new TypeError("Failed to fetch");
        }
        return conflict
          ? Response.json({ code: "order_cancellation_conflict" }, { status: 409 })
          : Response.json({ id: order.id, cancelledBy: "admin", cancelledAt: new Date().toISOString() });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
const open = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <OrderManagementPage />
    </QueryClientProvider>,
  );
const confirm = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "注文12を取り消す" }));
  return screen.findByRole("dialog");
};

describe("SPEC-SAL-006 注文管理からの取消", () => {
  it("Staffが内容を確認し、承認した時だけ取り消して一覧に取消済みを残す", async () => {
    open();
    const dialog = await confirm();
    expect(within(dialog).getByText("ラーメン × 2個")).toBeDefined();
    expect(within(dialog).getByText(/2026-10-24/)).toBeDefined();
    expect(cancelled).toBe(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
    expect(cancelled).toBe(0);
    const reopened = await confirm();
    fireEvent.click(within(reopened).getByRole("button", { name: "はい、取り消す" }));
    await screen.findByText("注文12を取り消し、在庫を戻しました。");
    expect(cancelled).toBe(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "注文12を取り消す" }).hasAttribute("disabled")).toBe(true),
    );
    await screen.findByText("取消済み");
  });
  it.each(["None"])("%sは注文管理データを取得せず取消もできない", async (value) => {
    role = value;
    open();
    await screen.findByText("注文管理にはスタッフ権限が必要です。");
    expect(requests.mock.calls.every(([url]) => String(url).endsWith("/auth/session"))).toBe(true);
  });
  it("別端末の取消通知で確認を閉じ、取消を送信しない", async () => {
    open();
    await confirm();
    orders = [{ ...order, cancelledAt: new Date().toISOString() }];
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ orders: revision }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(cancelled).toBe(0);
  });
  it("確認中にドリンクだけが完成しても確認を閉じ、取消不可の理由を表示する", async () => {
    open();
    await confirm();
    orders = [
      {
        ...order,
        lines: [...order.lines, { menuItemId: "tea", name: "お茶", quantity: 1, cookingState: "completed" }],
      },
    ];
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ orders: revision }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await screen.findByText("完成した商品あり");
    expect(screen.getByRole("button", { name: "注文12を取り消す" }).hasAttribute("disabled")).toBe(true);
    expect(cancelled).toBe(0);
  });

  it("取得失敗中は古い注文を取り消せず、再取得後に操作できる", async () => {
    open();
    await confirm();
    failed = true;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ orders: revision }));
    await screen.findByText(/最新の注文を取得できません/);
    expect(screen.getByRole("button", { name: "はい、取り消す" }).hasAttribute("disabled")).toBe(true);
    expect(cancelled).toBe(0);
    failed = false;
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ orders: revision }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "はい、取り消す" }).hasAttribute("disabled")).toBe(false),
    );
  });
  it("競合は自動再送せず、取消済みとなった一覧を取得する", async () => {
    conflict = true;
    open();
    fireEvent.click(within(await confirm()).getByRole("button", { name: "はい、取り消す" }));
    await screen.findByText(/注文の状態または権限が変わりました/);
    await screen.findByText("取消済み");
    expect(cancelled).toBe(1);
  });
  it("送信中は二重操作を止め、応答を失っても自動再送せず最新の一覧で確認する", async () => {
    lostResponse = true;
    let release: (() => void) | undefined;
    pendingResponse = new Promise<void>((resolve) => {
      release = resolve;
    });
    open();
    fireEvent.click(within(await confirm()).getByRole("button", { name: "はい、取り消す" }));
    await waitFor(() => expect(cancelled).toBe(1));
    expect(screen.getByRole("button", { name: "注文12を取り消す" }).hasAttribute("disabled")).toBe(true);
    act(() => release?.());
    await screen.findByText(/取消結果を確認できません/);
    await screen.findByText("取消済み");
    expect(cancelled).toBe(1);
  });
  it("営業日を変えたらその日の注文を要求し、開いていた確認を閉じる", async () => {
    open();
    await confirm();
    fireEvent.change(screen.getByLabelText("営業日"), { target: { value: "2026-10-23" } });
    await waitFor(() =>
      expect(requests.mock.calls.some(([url]) => String(url).includes("businessDate=2026-10-23"))).toBe(true),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(cancelled).toBe(0);
  });
});
