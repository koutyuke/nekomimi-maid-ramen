import type { Meta, StoryObj } from "@storybook/react-vite";

import { handoffPageFixture, handoffOrdersFixture } from "../testing";
import { HandoffPageUI } from "./handoff-page.ui";

const meta = {
  render: (args) => <HandoffPageUI {...args} />,
  title: "Pages/Handoff",
  component: HandoffPageUI,
  args: handoffPageFixture,
} satisfies Meta<typeof HandoffPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Empty: Story = { args: { orders: { status: "success", data: [] } } };
export const Loading: Story = { args: { orders: { status: "pending", data: undefined }, realtimeConnected: false } };
export const Disconnected: Story = { args: { realtimeConnected: false } };
export const Failed: Story = { args: { orders: { status: "error", data: handoffOrdersFixture } } };
export const InitialFailed: Story = { args: { orders: { status: "error", data: undefined } } };
export const Denied: Story = { args: { orders: { status: "denied", data: undefined }, realtimeConnected: false } };
export const UpdatingDrink: Story = { args: { pendingLines: [{ orderId: "order-2", menuItemId: "cola" }] } };
export const CompletingHandoff: Story = { args: { handoffPending: true } };
export const UpdateFailed: Story = {
  args: {
    cookingError: "商品の状態または権限が変わりました。一覧を確認してから操作してください。",
    handoffError: "記録結果を確認できません。再照合し、受け渡し済みか確認してください。",
  },
};
