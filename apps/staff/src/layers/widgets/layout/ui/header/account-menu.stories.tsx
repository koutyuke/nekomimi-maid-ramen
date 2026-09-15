import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountMenuUI } from "./account-menu.ui";

const staff = { id: "staff", name: "猫田 まい", email: "mai.neko@example.com", role: "Staff" as const };

const meta = {
  component: AccountMenuUI,
  title: "Widgets/Layout/AccountMenu",
  parameters: { routerPath: "/sales" },
  args: {
    staff,
    logoutStatus: "idle",
    onLogout: fn(),
  },
} satisfies Meta<typeof AccountMenuUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LoggingOut: Story = { args: { logoutStatus: "pending" } };
export const LogoutFailed: Story = { args: { logoutStatus: "error" } };
