import { menuFixture } from "../../../entities/menu/testing";
import type { OrderEntryPageUIProps } from "../ui/order-entry-page.ui";

const noop = () => {};
export const orderEntryPageFixture: OrderEntryPageUIProps = {
  menu: { status: "success", data: menuFixture },
  realtimeConnected: true,
  draft: {
    lines: menuFixture
      .filter((item) => item.sellable)
      .slice(0, 2)
      .map((item) => ({ item, quantity: "2" })),
    received: 2000,
    checkout: { total: 1600, change: 400 },
    shortages: [],
  },
  confirmation: { status: "idle" },
  canConfirm: true,
  previousOrder: null,
  onRefreshMenu: noop,
  onChangeQuantity: noop,
  onChangeReceived: noop,
  onConfirmOrder: noop,
  onRetryConfirmation: noop,
  onStartNextOrder: noop,
};

export const receiptFixture = {
  order: {
    orderId: "order-42",
    businessDate: "2026-10-30",
    orderNumber: 42,
    totalAmount: 1000,
    cookingState: "unstarted" as const,
    lines: [
      { menuItemId: "item-ramen", quantity: 2, unitPrice: 500, subtotal: 1000, cookingState: "unstarted" as const },
    ],
  },
  names: { "item-ramen": "ラーメン" },
  received: 2000,
  quotedTotal: 1000,
};
