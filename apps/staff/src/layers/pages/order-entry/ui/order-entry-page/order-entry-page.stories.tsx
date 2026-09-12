import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderEntryPageFixture, receiptFixture } from "../../testing";
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
const cannotSubmit = { ...orderEntryPageFixture.submission, canConfirm: false, canSubmit: false };
const emptyDraft = { lines: [], received: "", checkout: { total: null, change: null }, submission: cannotSubmit };
export const Checkout: Story = {};
export const Empty: Story = { args: emptyDraft };
export const InsufficientCash: Story = {
  args: { received: "100", checkout: { total: 1600, change: null }, submission: cannotSubmit },
};
export const OutOfStock: Story = {
  args: { result: { kind: "shortage", shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }] } },
};
export const Uncertain: Story = {
  args: { submission: { ...cannotSubmit, uncertain: true, locked: true, canSubmit: true } },
};
export const Loading: Story = { args: { items: [], menuLoading: true, submission: cannotSubmit } };
export const Failed: Story = { args: { menuFailed: true, submission: cannotSubmit } };

export const Confirmed: Story = {
  args: {
    previousOrder: receiptFixture,
    result: { kind: "confirmed", order: receiptFixture.order },
    submission: { ...cannotSubmit, locked: true },
  },
};
export const PreviousOrder: Story = { args: { ...emptyDraft, previousOrder: receiptFixture } };
