import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuFixture } from "../../../../entities/menu/testing";
import { MenuPageUI } from "./menu-page.ui";

const noop = () => {};

const meta = {
  component: MenuPageUI,
  title: "Pages/Menu/MenuPage",
  args: { actions: { onRetry: noop } },
} satisfies Meta<typeof MenuPageUI>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { items: menuFixture, loading: false, failed: false },
};

export const Loading: Story = {
  args: { items: [], loading: true, failed: false },
};

export const Failed: Story = {
  args: { items: [], loading: false, failed: true },
};

export const Empty: Story = {
  args: { items: [], loading: false, failed: false },
};
