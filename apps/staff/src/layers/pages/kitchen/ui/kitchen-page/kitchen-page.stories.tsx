import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { kitchenPageFixture } from "../../testing";
import { KitchenPageUI } from "./kitchen-page.ui";

const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory({ initialEntries: ["/"] }) });

const meta = {
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
  component: KitchenPageUI,
  title: "Pages/Kitchen/KitchenPage",
  args: { ...kitchenPageFixture, actions: { onRetry: fn(), onUpdate: fn() } },
} satisfies Meta<typeof KitchenPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = {};
export const Empty: Story = { args: { orders: [] } };
export const Loading: Story = { args: { loading: true, orders: [] } };
export const Disconnected: Story = { args: { connected: false } };
export const Failed: Story = { args: { failed: true, error: "更新結果を確認できません。一覧を読み直してください。" } };
export const Denied: Story = { args: { access: "denied" } };
