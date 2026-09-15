import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavigationUI } from "./navigation";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

const meta = {
  component: NavigationUI,
  title: "Widgets/Layout/Navigation",
  args: { role: "Staff" },
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
} satisfies Meta<typeof NavigationUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Staff: Story = {};
export const Admin: Story = { args: { role: "Admin" } };
export const Owner: Story = { args: { role: "Owner" } };
export const None: Story = { args: { role: "None" } };
