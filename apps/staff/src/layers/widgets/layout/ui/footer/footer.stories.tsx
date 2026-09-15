import { AppShell } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Footer } from "../footer/footer";

const meta = {
  component: Footer,
  title: "Widgets/Layout/Footer",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AppShell>
        <Story />
      </AppShell>
    ),
  ],
} satisfies Meta<typeof Footer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
