import { cookingStateLabels } from "../../../entities/kitchen";
import type { CookingState, KitchenOrder, KitchenOrderLine } from "../../../entities/kitchen";

export type KitchenFilter = "all" | "main" | "side";

export const kitchenStatusLabels = { ...cookingStateLabels, completed: "対応済み" } as const;
const statusRank = { cooking: 0, unstarted: 1, completed: 2 } as const;

const statusOf = (lines: readonly KitchenOrderLine[]): CookingState => {
  if (lines.every((line) => line.cookingState === "completed")) {
    return "completed";
  }
  if (lines.every((line) => line.cookingState === "unstarted")) {
    return "unstarted";
  }
  return "cooking";
};

export const visibleKitchenOrders = (orders: readonly KitchenOrder[], filter: KitchenFilter, hideHandled: boolean) =>
  orders
    .map((order) => {
      const lines = order.lines.filter(
        (line) => line.category !== "drink" && (filter === "all" || line.category === filter),
      );
      return { order, lines, status: statusOf(lines) };
    })
    .filter(({ lines, status }) => lines.length > 0 && (!hideHandled || status !== "completed"))
    .toSorted(
      (left, right) =>
        statusRank[left.status] - statusRank[right.status] || left.order.orderNumber - right.order.orderNumber,
    );
