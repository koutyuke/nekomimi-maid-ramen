import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { StaffManagementPageUI } from "./staff-management-page.ui";
import type { Staff } from "../../../entities/staff";

const members = [
  { id: "owner", name: "オーナー", email: "owner@example.com", role: "Owner" },
  { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" },
  { id: "staff", name: "スタッフ", email: "staff@example.com", role: "Staff" },
  { id: "none", name: "利用者", email: "user@example.com", role: "None" },
] satisfies readonly Staff[];

const meta = {
  component: StaffManagementPageUI,
  title: "Pages/StaffManagement/StaffManagementPage",
  args: {
    currentStaff: { id: "admin", role: "Admin" },
    members: { status: "success", data: members },
    roleUpdate: { status: "idle" },
    onRetry: fn(),
    onUpdateRole: fn(),
  },
} satisfies Meta<typeof StaffManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Members: Story = {};
export const Loading: Story = { args: { members: { status: "pending" } } };
export const Failed: Story = { args: { members: { status: "error" } } };
export const Updating: Story = { args: { roleUpdate: { status: "pending" } } };
export const UpdateFailed: Story = { args: { roleUpdate: { status: "error" } } };
export const Updated: Story = {
  args: { roleUpdate: { status: "success", result: { name: "スタッフ", role: "Admin" } } },
};
