import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuFixture } from "../../../../entities/menu/testing";
import { PriceTableUI } from "./price-table.ui";

const meta = {
  component: PriceTableUI,
  title: "Pages/ProductManagement/PriceTable",
  args: {
    items: menuFixture,
    busy: false,
    updatingMenuItemId: null,
    onUpdate: fn(),
  },
} satisfies Meta<typeof PriceTableUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Items: Story = {};
export const Updating: Story = {
  args: { busy: true, updatingMenuItemId: menuFixture[0]!.id },
};
