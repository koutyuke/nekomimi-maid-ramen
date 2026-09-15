import type { Meta, StoryObj } from "@storybook/react-vite";

import { StaffRoleBadge } from "./staff-role-badge";

const meta = {
  component: StaffRoleBadge,
  title: "Entities/Staff/StaffRoleBadge",
  args: { role: "Staff" },
} satisfies Meta<typeof StaffRoleBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Staff: Story = {};
export const Owner: Story = { args: { role: "Owner" } };
export const Admin: Story = { args: { role: "Admin" } };
export const None: Story = { args: { role: "None" } };
