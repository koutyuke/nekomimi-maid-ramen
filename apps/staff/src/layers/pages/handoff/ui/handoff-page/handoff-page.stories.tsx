import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { handoffPageFixture } from "../../testing";
import { HandoffPageUI } from "./handoff-page.ui";

const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory({ initialEntries: ["/"] }) });
const meta = {
  decorators: [
    (Story) => (
      <RouterContextProvider router={router}>
        <Story />
      </RouterContextProvider>
    ),
  ],
  title: "Pages/Handoff",
  component: HandoffPageUI,
  args: handoffPageFixture,
} satisfies Meta<typeof HandoffPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Disconnected: Story = { args: { connected: false } };
