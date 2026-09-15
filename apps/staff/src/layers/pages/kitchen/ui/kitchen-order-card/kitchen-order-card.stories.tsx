import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { kitchenOrdersFixture } from "../../testing";
import { KitchenOrderCardUI } from "./kitchen-order-card.ui";

const [unstartedOrder, cookingOrder, completedOrder] = kitchenOrdersFixture;
const kitchenLines = (order: NonNullable<typeof unstartedOrder>) =>
  order.lines.filter((line) => line.category !== "drink");

const meta = {
  component: KitchenOrderCardUI,
  title: "Pages/Kitchen/KitchenOrderCard",
  args: {
    order: unstartedOrder!,
    lines: kitchenLines(unstartedOrder!),
    status: "unstarted",
    disabled: false,
    pendingItemIds: [],
    onUpdate: fn(),
  },
} satisfies Meta<typeof KitchenOrderCardUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unstarted: Story = {};
export const Cooking: Story = {
  args: { order: cookingOrder!, lines: kitchenLines(cookingOrder!), status: "cooking" },
};
export const Completed: Story = {
  args: { order: completedOrder!, lines: kitchenLines(completedOrder!), status: "completed" },
};
export const Pending: Story = { args: { pendingItemIds: ["ramen"] } };
export const Disabled: Story = { args: { disabled: true } };
export const HandedOff: Story = {
  args: { order: { ...cookingOrder!, handedOffAt: "2026-10-24T02:00:00.000Z" }, lines: kitchenLines(cookingOrder!) },
};
