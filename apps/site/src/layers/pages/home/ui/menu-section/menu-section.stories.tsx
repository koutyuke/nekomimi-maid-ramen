import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuItemsFixture } from "../../testing/menu-fixtures";
import { MenuSectionUI } from "./menu-section.ui";

const meta = {
  title: "Pages/Home/MenuSection",
  component: MenuSectionUI,
  args: { items: menuItemsFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MenuSectionUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DetailOpen: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /ラーメン/ }));
  },
};
