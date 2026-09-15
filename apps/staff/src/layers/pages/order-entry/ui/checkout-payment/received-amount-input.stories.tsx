import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ReceivedAmountInputUI } from "./received-amount-input.ui";

const meta = {
  component: ReceivedAmountInputUI,
  title: "Pages/OrderEntry/ReceivedAmountInput",
  args: { value: 2000, disabled: false, onChange: fn() },
} satisfies Meta<typeof ReceivedAmountInputUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Entered: Story = {};
export const Empty: Story = { args: { value: null } };
export const Disabled: Story = { args: { disabled: true } };
