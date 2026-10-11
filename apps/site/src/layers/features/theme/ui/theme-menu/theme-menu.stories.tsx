import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeMenuUI } from "./theme-menu.ui";

const meta = {
  title: "Features/Theme/ThemeMenu",
  component: ThemeMenuUI,
  args: { theme: "system", onThemeChange: fn() },
} satisfies Meta<typeof ThemeMenuUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { theme: "light" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "テーマを切り替える" }));
  },
};
