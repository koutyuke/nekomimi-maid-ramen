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
    members,
    loading: false,
    failed: false,
    busy: false,
    updateFailed: false,
    updateResult: null,
    onRetry: fn(),
    onUpdateRole: fn(),
  },
} satisfies Meta<typeof StaffManagementPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Members: Story = {};
export const Loading: Story = { args: { members: [], loading: true } };
export const Failed: Story = { args: { members: [], failed: true } };
export const Updating: Story = { args: { busy: true } };
export const UpdateFailed: Story = { args: { updateFailed: true } };
export const Updated: Story = {
  args: { updateResult: { name: "スタッフ", role: "Admin" } },
};
