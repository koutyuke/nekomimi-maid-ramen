import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavigationUI } from "./navigation.ui";

const meta = {
  component: NavigationUI,
  title: "Widgets/Layout/Navigation",
  args: { role: "Staff" },
  parameters: { routerPath: "/sales" },
} satisfies Meta<typeof NavigationUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Staff: Story = {};
export const Admin: Story = { args: { role: "Admin" } };
export const Owner: Story = { args: { role: "Owner" } };
export const None: Story = { args: { role: "None" } };
