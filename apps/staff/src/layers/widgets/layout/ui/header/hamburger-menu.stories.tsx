import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HamburgerMenuUI } from "./hamburger-menu.ui";

const meta = {
  component: HamburgerMenuUI,
  title: "Widgets/Layout/HamburgerMenu",
  parameters: { routerPath: "/sales" },
  args: {
    staff: { id: "staff", name: "猫田 まい", email: "mai.neko@example.com", role: "Admin" },
    sessionStatus: "success",
    logoutStatus: "idle",
    onLogout: fn(),
  },
} satisfies Meta<typeof HamburgerMenuUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { staff: null, sessionStatus: "pending" } };
export const SessionError: Story = { args: { staff: null, sessionStatus: "error" } };
export const Unauthenticated: Story = { args: { staff: null } };
export const LoggingOut: Story = { args: { logoutStatus: "pending" } };
export const LogoutFailed: Story = { args: { logoutStatus: "error" } };
