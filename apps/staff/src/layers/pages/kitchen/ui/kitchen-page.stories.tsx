import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { kitchenPageFixture, kitchenOrdersFixture } from "../testing";
import { KitchenPageUI } from "./kitchen-page.ui";

const meta = {
  component: KitchenPageUI,
  title: "Pages/Kitchen/KitchenPage",
  args: { ...kitchenPageFixture, onRetry: fn(), onUpdate: fn() },
} satisfies Meta<typeof KitchenPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = {};
export const Empty: Story = { args: { orders: { status: "success", data: [] } } };
export const Loading: Story = { args: { orders: { status: "pending", data: undefined }, realtimeConnected: false } };
export const Disconnected: Story = { args: { realtimeConnected: false } };
export const Failed: Story = { args: { orders: { status: "error", data: kitchenOrdersFixture } } };
export const InitialFailed: Story = { args: { orders: { status: "error", data: undefined } } };
export const Denied: Story = { args: { orders: { status: "denied", data: undefined }, realtimeConnected: false } };
export const Updating: Story = { args: { pendingLines: [{ orderId: "order-1", menuItemId: "ramen" }] } };
export const UpdateFailed: Story = { args: { updateError: "更新結果を確認できません。一覧を読み直してください。" } };
