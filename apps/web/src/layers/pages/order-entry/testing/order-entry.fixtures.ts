import { menuFixture } from "../../../entities/menu/testing";
import type { OrderEntryPageUIProps } from "../ui/order-entry-page.ui";

const noop = () => {};
export const orderEntryPageFixture: OrderEntryPageUIProps = {
  access: "allowed",
  items: menuFixture,
  menuLoading: false,
  menuFailed: false,
  lines: menuFixture
    .filter((item) => item.sellable)
    .slice(0, 2)
    .map((item) => ({ item, quantity: "2" })),
  received: "2000",
  pending: false,
  uncertain: false,
  result: null,
  previousOrder: null,
  actions: {
    onRetry: noop,
    onStep: noop,
    onReceived: noop,
    onSubmit: noop,
    onNext: noop,
  },
};

export const receiptFixture = {
  order: {
    orderId: "order-42",
    businessDate: "2026-10-30",
    orderNumber: 42,
    totalAmount: 1000,
    cookingState: "unstarted" as const,
    lines: [{ menuItemId: "item-ramen", quantity: 2, unitPrice: 500, subtotal: 1000 }],
  },
  names: { "item-ramen": "ラーメン" },
  received: 2000,
  quotedTotal: 1000,
};
