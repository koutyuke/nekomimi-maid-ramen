import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderManagementOrdersFixture } from "../../testing";
import { OrderTableUI } from "./order-table.ui";

const order = orderManagementOrdersFixture[0]!;

const meta = {
  component: OrderTableUI,
  title: "Pages/OrderManagement/OrderTable",
  args: {
    orders: orderManagementOrdersFixture,
    disabled: false,
    pending: false,
    onCancel: fn(),
  },
} satisfies Meta<typeof OrderTableUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Orders: Story = {};
export const Paginated: Story = {
  args: {
    orders: Array.from({ length: 42 }, (_, index) => ({
      ...order,
      id: `order-${index + 1}`,
      orderNumber: index + 1,
      cancelledAt: index % 4 === 0 ? "2026-10-24T02:00:00Z" : null,
      handedOffAt: index % 4 === 1 ? "2026-10-24T02:00:00Z" : null,
      lines: [{ ...order.lines[0]!, cookingState: index % 4 === 2 ? ("completed" as const) : ("cooking" as const) }],
    })),
  },
};
export const Pending: Story = { args: { pending: true } };
export const Disabled: Story = { args: { orders: undefined, disabled: true } };
