import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderManagementPageFixture, orderManagementOrdersFixture } from "../testing";
import { OrderManagementPageUI } from "./order-management-page.ui";

const meta = {
  render: (args) => <OrderManagementPageUI {...args} />,
  title: "Pages/OrderManagement",
  component: OrderManagementPageUI,
  args: { ...orderManagementPageFixture, onBusinessDateChange: fn(), onCancel: fn(), onRetry: fn() },
} satisfies Meta<typeof OrderManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = {};
export const Loading: Story = { args: { orders: { status: "pending", data: undefined }, realtimeConnected: false } };
export const Failed: Story = { args: { orders: { status: "error", data: orderManagementOrdersFixture } } };
export const InitialFailed: Story = { args: { orders: { status: "error", data: undefined } } };
export const Denied: Story = { args: { orders: { status: "denied", data: undefined } } };
export const Cancelling: Story = { args: { cancellationPending: true } };
export const CancellationFailed: Story = {
  args: {
    cancellationError:
      "取消結果を確認できません。再読み込みして注文の取消状況を確認してください。重ねて返金しないでください。",
  },
};
export const Empty: Story = { args: { orders: { status: "success", data: [] } } };
export const Cancelled: Story = {
  args: {
    orders: { status: "success", data: [{ ...orderManagementOrdersFixture[0]!, cancelledAt: "2026-10-24T02:00:00Z" }] },
    cancelledOrderNumber: 12,
  },
};
export const Paginated: Story = {
  args: {
    realtimeConnected: false,
    orders: {
      status: "success",
      data: Array.from({ length: 42 }, (_, index) => ({
        ...orderManagementOrdersFixture[0]!,
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
  },
};
