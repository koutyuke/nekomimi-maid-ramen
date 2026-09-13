import type { OrderManagementPageUIProps } from "../ui/order-management-page/order-management-page.ui";

export const orderManagementPageFixture: OrderManagementPageUIProps = {
  access: "allowed",
  businessDate: "2026-10-24",
  orders: [
    {
      id: "order-1",
      businessDate: "2026-10-24",
      orderNumber: 12,
      cookingState: "cooking",
      handedOffAt: null,
      cancelledAt: null,
      lines: [{ menuItemId: "ramen", name: "ラーメン", quantity: 2, cookingState: "cooking" }],
    },
  ],
  connected: true,
  loading: false,
  failed: false,
  pending: false,
  error: null,
  cancelledOrderNumber: null,
  actions: { onBusinessDateChange: () => {}, onCancel: () => {}, onRetry: () => {} },
};
