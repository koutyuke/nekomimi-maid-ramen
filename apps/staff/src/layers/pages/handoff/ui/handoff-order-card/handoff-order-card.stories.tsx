import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { handoffOrdersFixture } from "../../testing";
import { HandoffOrderCardUI } from "./handoff-order-card.ui";

const [readyOrder, drinkPendingOrder, preparingOrder, completedOrder] = handoffOrdersFixture;

const meta = {
  component: HandoffOrderCardUI,
  title: "Pages/Handoff/HandoffOrderCard",
  args: {
    order: readyOrder!,
    status: "ready",
    disabled: false,
    pendingItemIds: [],
    onUpdate: fn(),
    onComplete: fn(),
  },
} satisfies Meta<typeof HandoffOrderCardUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const DrinkPending: Story = { args: { order: drinkPendingOrder!, status: "drinkPending" } };
export const Preparing: Story = { args: { order: preparingOrder!, status: "preparing" } };
export const Completed: Story = { args: { order: completedOrder!, status: "completed" } };
export const PendingDrink: Story = {
  args: { order: drinkPendingOrder!, status: "drinkPending", pendingItemIds: ["cola"] },
};
export const Disabled: Story = { args: { disabled: true } };
