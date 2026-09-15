import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuFixture } from "../../../entities/menu/testing";
import { InventoryManagementPageUI } from "./inventory-management-page.ui";

const meta = {
  component: InventoryManagementPageUI,
  title: "Pages/InventoryManagement/InventoryManagementPage",
  args: {
    inventory: { status: "success", data: menuFixture },
    stockUpdate: { status: "idle" },
    onRetry: fn(),
    onUpdate: fn(),
  },
} satisfies Meta<typeof InventoryManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inventory: Story = {};
export const Empty: Story = { args: { inventory: { status: "success", data: [] } } };
export const Loading: Story = { args: { inventory: { status: "pending" } } };
export const Failed: Story = { args: { inventory: { status: "error" } } };
export const Denied: Story = { args: { inventory: { status: "denied" } } };
export const Updating: Story = {
  args: { stockUpdate: { status: "pending", menuItemId: menuFixture[0]!.id } },
};
export const UpdateFailed: Story = { args: { stockUpdate: { status: "error" } } };
export const Updated: Story = {
  args: {
    stockUpdate: {
      status: "success",
      result: { name: menuFixture[0]!.name, previousQuantity: 30, quantity: 20 },
    },
  },
};
