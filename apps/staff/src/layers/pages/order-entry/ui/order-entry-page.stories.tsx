import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderEntryPageFixture, receiptFixture } from "../testing";
import { OrderEntryPageUI } from "./order-entry-page.ui";

const meta = {
  component: OrderEntryPageUI,
  title: "Pages/OrderEntry/OrderEntryPage",
  args: {
    ...orderEntryPageFixture,
    onRefreshMenu: fn(),
    onChangeQuantity: fn(),
    onChangeReceived: fn(),
    onConfirmOrder: fn(),
    onRetryConfirmation: fn(),
    onStartNextOrder: fn(),
  },
} satisfies Meta<typeof OrderEntryPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
const emptyDraft = { lines: [], received: null, checkout: { total: null, change: null }, shortages: [] };
export const Checkout: Story = {};
export const Empty: Story = { args: { draft: emptyDraft, canConfirm: false } };
export const InsufficientCash: Story = {
  args: {
    draft: { ...orderEntryPageFixture.draft, received: 100, checkout: { total: 1600, change: null } },
    canConfirm: false,
  },
};
export const OutOfStock: Story = {
  args: {
    confirmation: {
      status: "failed",
      result: { kind: "shortage", shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }] },
    },
  },
};
export const Pending: Story = { args: { confirmation: { status: "pending" }, canConfirm: false } };
export const Uncertain: Story = {
  args: { confirmation: { status: "uncertain", rejection: null }, canConfirm: false },
};
export const Loading: Story = {
  args: {
    menu: { status: "pending", data: undefined },
    draft: emptyDraft,
    canConfirm: false,
    realtimeConnected: false,
  },
};
export const Failed: Story = {
  args: {
    menu: { status: "error", data: orderEntryPageFixture.menu.data },
    canConfirm: false,
    realtimeConnected: false,
  },
};
export const Denied: Story = {
  args: { menu: { status: "denied", data: undefined }, canConfirm: false, realtimeConnected: false },
};
export const Confirmed: Story = {
  args: {
    previousOrder: receiptFixture,
    confirmation: { status: "confirmed", receipt: receiptFixture },
    canConfirm: false,
  },
};
export const PreviousOrder: Story = { args: { draft: emptyDraft, canConfirm: false, previousOrder: receiptFixture } };
