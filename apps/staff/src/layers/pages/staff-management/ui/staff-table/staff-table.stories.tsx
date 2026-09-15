import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { StaffTableUI } from "./staff-table.ui";
import type { Staff } from "../../../../entities/staff";

const members = [
  { id: "owner", name: "オーナー", email: "owner@example.com", role: "Owner" },
  { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" },
  { id: "staff", name: "スタッフ", email: "staff@example.com", role: "Staff" },
  { id: "none", name: "利用者", email: "user@example.com", role: "None" },
] satisfies readonly Staff[];

const meta = {
  component: StaffTableUI,
  title: "Pages/StaffManagement/StaffTable",
  args: {
    currentStaff: { id: "admin", role: "Admin" },
    members,
    busy: false,
    onUpdateRole: fn(),
  },
} satisfies Meta<typeof StaffTableUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Admin: Story = {};
export const Owner: Story = { args: { currentStaff: { id: "owner", role: "Owner" } } };
export const Updating: Story = { args: { busy: true } };
