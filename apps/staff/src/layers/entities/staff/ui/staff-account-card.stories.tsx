import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { StaffAccountCard } from "./staff-account-card";

const meta = {
  component: StaffAccountCard,
  title: "Entities/Staff/StaffAccountCard",
  args: {
    name: "猫田 まい",
    email: "mai.neko@example.com",
    role: "Staff",
    onRetry: fn(),
    onLogout: fn(),
  },
} satisfies Meta<typeof StaffAccountCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Staff: Story = {};
export const Owner: Story = { args: { role: "Owner" } };
export const Admin: Story = { args: { role: "Admin" } };
export const NoPermission: Story = { args: { role: "None" } };
