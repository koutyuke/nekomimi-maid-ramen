import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { updateCookingState } from "../api/update-cooking-state";
import { useCookingStateUpdate } from "./use-cooking-state-update";
import type { KitchenOrder } from "./kitchen-order";

vi.mock("../api/update-cooking-state", () => ({ updateCookingState: vi.fn() }));

it("SPEC-KIT-002 SPEC-HAND-003 別商品の成功後に先行する更新が失敗してもエラーを表示する", async () => {
  let rejectFirst: (cause: Error) => void = vi.fn();
  let resolveSecond: () => void = vi.fn();
  vi.mocked(updateCookingState)
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = () => resolve({ id: "order-1", menuItemId: "gyoza", cookingState: "cooking" });
        }),
    );
  const onSettled = vi.fn(async () => {});
  const client = new QueryClient();
  const { result } = renderHook(() => useCookingStateUpdate(onSettled), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  const order: KitchenOrder = {
    id: "order-1",
    businessDate: "2026-10-24",
    orderNumber: 1,
    confirmedAt: "2026-10-24T01:00:00Z",
    cancelledAt: null,
    handedOffAt: null,
    cookingState: "unstarted",
    lines: [
      { menuItemId: "ramen", name: "ラーメン", quantity: 1, category: "main", cookingState: "unstarted" },
      { menuItemId: "gyoza", name: "餃子", quantity: 1, category: "side", cookingState: "unstarted" },
    ],
  };
  act(() => {
    result.current.mutate({ order, line: order.lines[0]!, to: "cooking" });
    result.current.mutate({ order, line: order.lines[1]!, to: "cooking" });
  });
  await waitFor(() => expect(result.current.pendingLines).toHaveLength(2));
  await act(async () => resolveSecond());
  await waitFor(() => expect(result.current.pendingLines).toEqual([{ orderId: order.id, menuItemId: "ramen" }]));
  await act(async () => rejectFirst(new Error("ラーメンの更新結果を確認できません。")));
  await waitFor(() => expect(result.current.pendingLines).toEqual([]));
  expect(result.current.error).toBe("ラーメンの更新結果を確認できません。");
  expect(onSettled).toHaveBeenCalledTimes(2);
});
