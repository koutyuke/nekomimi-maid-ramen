import type { KitchenPageUIProps } from "../ui/kitchen-page/kitchen-page.ui";

export const kitchenPageFixture: KitchenPageUIProps = {
  access: "allowed",
  loading: false,
  failed: false,
  connected: true,
  pendingLines: [],
  error: null,
  orders: (["unstarted", "cooking", "completed"] as const).map((state, index) => ({
    id: `order-${index + 1}`,
    businessDate: "2026-10-24",
    orderNumber: index + 1,
    cookingState: state,
    cancelledAt: null,
    handedOffAt: null,
    confirmedAt: "2026-10-24T01:00:00.000Z",
    lines: [
      { menuItemId: "ramen", name: "ラーメン", quantity: 2, category: "main", cookingState: state },
      { menuItemId: "gyoza", name: "餃子", quantity: 1, category: "side", cookingState: state },
      { menuItemId: "tea", name: "烏龍茶", quantity: 1, category: "drink", cookingState: state },
    ],
  })),
  actions: { onRetry: () => {}, onUpdate: () => {} },
};
