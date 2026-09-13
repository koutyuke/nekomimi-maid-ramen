import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderManagementPageFixture } from "../../testing";
import { OrderManagementPageUI } from "./order-management-page.ui";

const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory({ initialEntries: ["/"] }) });
const meta = {
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
  title: "Pages/OrderManagement",
  component: OrderManagementPageUI,
  args: orderManagementPageFixture,
} satisfies Meta<typeof OrderManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = {};
export const Failed: Story = { args: { failed: true } };
export const Empty: Story = { args: { orders: [] } };
export const Cancelled: Story = {
  args: {
    orders: [{ ...orderManagementPageFixture.orders[0]!, cancelledAt: "2026-10-24T02:00:00Z" }],
    cancelledOrderNumber: 12,
  },
};
export const Paginated: Story = {
  args: {
    connected: false,
    orders: Array.from({ length: 42 }, (_, index) => ({
      ...orderManagementPageFixture.orders[0]!,
      id: `order-${index + 1}`,
      orderNumber: index + 1,
      cancelledAt: index % 4 === 0 ? "2026-10-24T02:00:00Z" : null,
      handedOffAt: index % 4 === 1 ? "2026-10-24T02:00:00Z" : null,
      lines: [
        { menuItemId: "ramen", name: "ラーメン", quantity: 2, cookingState: "cooking" as const },
        {
          menuItemId: "tea",
          name: "お茶",
          quantity: 1,
          cookingState: index % 4 === 2 ? ("completed" as const) : ("unstarted" as const),
        },
      ],
    })),
  },
};
