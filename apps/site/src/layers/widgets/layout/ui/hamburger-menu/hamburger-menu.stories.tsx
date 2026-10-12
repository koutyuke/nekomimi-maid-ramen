import type { Meta, StoryObj } from "@storybook/react-vite";

import { HamburgerMenu } from "./hamburger-menu";

const meta = {
  title: "Widgets/Layout/HamburgerMenu",
  component: HamburgerMenu,
} satisfies Meta<typeof HamburgerMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "メニューを開く" }));
  },
};
