import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./header";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

const meta = {
  component: Header,
  title: "Widgets/Layout/Header",
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
} satisfies Meta<typeof Header>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
