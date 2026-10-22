import type { SalesSummary } from "../model/sales-summary";

export const salesSummaryFixture: SalesSummary = {
  orderCount: 2,
  totalAmount: 1650,
  items: [
    { menuItemId: "ramen", name: "ラーメン", quantity: 3, amount: 1450 },
    { menuItemId: "gyoza", name: "餃子", quantity: 0, amount: 0 },
    { menuItemId: "tea", name: "お茶", quantity: 1, amount: 200 },
  ],
};
