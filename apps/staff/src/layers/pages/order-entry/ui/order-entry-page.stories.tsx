import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderEntryPageFixture, receiptFixture } from "../testing";
import { OrderEntryPageUI } from "./order-entry-page.ui";

const meta = {
  component: OrderEntryPageUI,
  title: "Pages/OrderEntry/OrderEntryPage",
  args: {
    ...orderEntryPageFixture,
    actions: { onRetry: fn(), onStep: fn(), onReceived: fn(), onSubmit: fn(), onNext: fn() },
  },
} satisfies Meta<typeof OrderEntryPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Checkout: Story = {};
export const Empty: Story = { args: { lines: [], received: "" } };
export const InsufficientCash: Story = { args: { received: "100" } };
export const OutOfStock: Story = {
  args: { result: { kind: "shortage", shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }] } },
};
export const Uncertain: Story = { args: { uncertain: true } };
export const Loading: Story = { args: { items: [], menuLoading: true } };
export const Failed: Story = { args: { menuFailed: true } };

export const Confirmed: Story = {
  args: { previousOrder: receiptFixture, result: { kind: "confirmed", order: receiptFixture.order } },
};
export const PreviousOrder: Story = { args: { previousOrder: receiptFixture, lines: [], received: "" } };
