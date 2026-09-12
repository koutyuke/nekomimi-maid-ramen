import type { HandoffOrder } from "../../../entities/handoff";

export type HandoffStatus = "ready" | "drinkPending" | "preparing" | "completed";

export const handoffStatusLabels = {
  ready: "受け渡し可能",
  drinkPending: "調理対応中",
  preparing: "調理対応中",
  completed: "完了",
} as const;

// ドリンク待ちは受け渡し担当が自分で進められるため、他の調理待ちより前に出す。
const statusRank = { ready: 0, drinkPending: 1, preparing: 2, completed: 3 } as const;

const statusOf = (order: HandoffOrder): HandoffStatus => {
  if (order.handedOffAt) {
    return "completed";
  }
  if (order.lines.length > 0 && order.lines.every((line) => line.cookingState === "completed")) {
    return "ready";
  }
  if (order.lines.some((line) => line.category === "drink" && line.cookingState !== "completed")) {
    return "drinkPending";
  }
  return "preparing";
};

export const visibleHandoffOrders = (orders: readonly HandoffOrder[], hideCompleted: boolean) =>
  orders
    .filter((order) => !order.cancelledAt)
    .map((order) => ({ order, status: statusOf(order) }))
    .filter(({ status }) => !hideCompleted || status !== "completed")
    .toSorted(
      (left, right) =>
        statusRank[left.status] - statusRank[right.status] || left.order.orderNumber - right.order.orderNumber,
    );
