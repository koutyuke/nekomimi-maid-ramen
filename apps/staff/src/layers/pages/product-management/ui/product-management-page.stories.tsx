import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuFixture } from "../../../entities/menu/testing";
import { ProductManagementPageUI } from "./product-management-page.ui";

const meta = {
  component: ProductManagementPageUI,
  title: "Pages/ProductManagement/ProductManagementPage",
  args: {
    products: { status: "success", data: menuFixture },
    itemUpdate: { status: "idle" },
    realtimeConnected: true,
    onRetry: fn(),
    onUpdate: fn(),
  },
} satisfies Meta<typeof ProductManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Products: Story = {};
export const Connecting: Story = { args: { realtimeConnected: false } };
export const Empty: Story = { args: { products: { status: "success", data: [] } } };
export const Loading: Story = { args: { products: { status: "pending" } } };
export const Failed: Story = { args: { products: { status: "error" } } };
export const Denied: Story = { args: { products: { status: "denied" } } };
export const UpdatingStock: Story = {
  args: { itemUpdate: { status: "pending", menuItemId: menuFixture[0]!.id, field: "stock" } },
};
export const UpdatingPrice: Story = {
  args: { itemUpdate: { status: "pending", menuItemId: menuFixture[0]!.id, field: "price" } },
};
export const StockUpdateFailed: Story = { args: { itemUpdate: { status: "error", field: "stock" } } };
export const PriceUpdateFailed: Story = { args: { itemUpdate: { status: "error", field: "price" } } };
