import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccessDeniedUI } from "./access-denied.ui";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

const meta = {
  title: "Widgets/AuthGuard/AccessDenied",
  component: AccessDeniedUI,
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
} satisfies Meta<typeof AccessDeniedUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Denied: Story = {};
