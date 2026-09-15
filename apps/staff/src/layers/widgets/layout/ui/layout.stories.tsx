import type { Meta, StoryObj } from "@storybook/react-vite";

import { Layout } from "./layout";

const meta = {
  component: Layout,
  title: "Widgets/Layout/Layout",
  args: { children: "ページ内容" },
} satisfies Meta<typeof Layout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
