import type { OrderSummary } from "../../../entities/orders";
import type { OrderManagementPageUIProps } from "../ui/order-management-page.ui";

export const orderManagementOrdersFixture: readonly OrderSummary[] = [
  {
    id: "order-1",
    businessDate: "2026-10-24",
    orderNumber: 12,
    cookingState: "cooking",
    handedOffAt: null,
    cancelledAt: null,
    lines: [{ menuItemId: "ramen", name: "ラーメン", quantity: 2, cookingState: "cooking" }],
  },
];

export const orderManagementPageFixture: OrderManagementPageUIProps = {
  businessDate: "2026-10-24",
  orders: { status: "success", data: orderManagementOrdersFixture },
  realtimeConnected: true,
  cancellationPending: false,
  cancellationError: null,
  cancelledOrderNumber: null,
  onBusinessDateChange: () => {},
  onCancel: () => {},
  onRetry: () => {},
};
