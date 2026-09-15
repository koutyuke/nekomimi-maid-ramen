import type { api } from "../../../shared/api";

export type Order = NonNullable<Awaited<ReturnType<typeof api.staff.orders.get>>["data"]>["orders"][number];
export type OrderLine = Order["lines"][number];
export type CookingState = Order["cookingState"];
export const cookingStateLabels = { unstarted: "未調理", cooking: "調理中", completed: "完成" } as const;

export type OrderSummary = Readonly<
  Pick<Order, "id" | "businessDate" | "orderNumber" | "cookingState" | "cancelledAt" | "handedOffAt">
> & {
  readonly lines: readonly Readonly<Pick<OrderLine, "menuItemId" | "name" | "quantity" | "cookingState">>[];
};

export const orderCancellationReason = (order: OrderSummary): string | null => {
  if (order.cancelledAt) {
    return "取消済み";
  }
  if (order.handedOffAt) {
    return "受け渡し済み";
  }
  return order.lines.some((line) => line.cookingState === "completed") ? "完成した商品あり" : null;
};
