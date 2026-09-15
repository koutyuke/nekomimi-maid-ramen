import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { orderEntryPageFixture, receiptFixture } from "../../testing";
import { OrderConfirmationDialogUI } from "./order-confirmation-dialog.ui";

const confirmation = {
  kind: "confirmation" as const,
  lines: orderEntryPageFixture.draft.lines,
  received: orderEntryPageFixture.draft.received,
  checkout: orderEntryPageFixture.draft.checkout,
  submission: "ready" as const,
};

const meta = {
  component: OrderConfirmationDialogUI,
  title: "Pages/OrderEntry/OrderConfirmationDialog",
  args: {
    opened: true,
    content: confirmation,
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof OrderConfirmationDialogUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Blocked: Story = { args: { content: { ...confirmation, submission: "blocked" } } };
export const Pending: Story = { args: { content: { ...confirmation, submission: "pending" } } };
export const Confirmed: Story = {
  args: { content: { kind: "confirmed", receipt: receiptFixture } },
};
export const PreviousOrder: Story = {
  args: { content: { kind: "previous", receipt: receiptFixture } },
};
