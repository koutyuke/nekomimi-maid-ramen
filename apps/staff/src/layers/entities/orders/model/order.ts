export type OrderSummary = {
  readonly id: string;
  readonly businessDate: string;
  readonly orderNumber: number;
  readonly cookingState: "unstarted" | "cooking" | "completed";
  readonly cancelledAt: string | null;
  readonly handedOffAt: string | null;
  readonly lines: readonly {
    readonly menuItemId: string;
    readonly name: string;
    readonly quantity: number;
    readonly cookingState: "unstarted" | "cooking" | "completed";
  }[];
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
