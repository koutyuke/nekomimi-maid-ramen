import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuFixture } from "../../../../entities/menu/testing";
import { orderEntryPageFixture } from "../../testing";
import { OrderItemsUI } from "./order-items.ui";

const meta = {
  component: OrderItemsUI,
  title: "Pages/OrderEntry/OrderItems",
  args: {
    items: menuFixture,
    lines: orderEntryPageFixture.draft.lines,
    disabled: false,
    canIncrease: true,
    onChangeQuantity: fn(),
  },
} satisfies Meta<typeof OrderItemsUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};
export const Empty: Story = { args: { lines: [] } };
export const RefreshUnavailable: Story = { args: { canIncrease: false } };
export const Disabled: Story = { args: { disabled: true } };
