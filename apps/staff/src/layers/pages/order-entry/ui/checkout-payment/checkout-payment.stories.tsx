import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CheckoutPaymentUI } from "./checkout-payment.ui";

const meta = {
  component: CheckoutPaymentUI,
  title: "Pages/OrderEntry/CheckoutPayment",
  args: {
    checkout: { total: 1600, change: 400 },
    received: 2000,
    disabled: false,
    onChangeReceived: fn(),
  },
} satisfies Meta<typeof CheckoutPaymentUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Empty: Story = { args: { checkout: { total: null, change: null }, received: null } };
export const InsufficientCash: Story = {
  args: { checkout: { total: 1600, change: null }, received: 100 },
};
export const Disabled: Story = { args: { disabled: true } };
