import { Box } from "@mantine/core";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HamburgerMenuUI } from "./hamburger-menu.ui";
import { HeaderUI } from "./header.ui";

const staff = { id: "staff", name: "猫田 まい", email: "mai.neko@example.com", role: "Admin" as const };

const meta = {
  component: HeaderUI,
  title: "Widgets/Layout/Header",
  render: () => (
    <HeaderUI
      hamburgerMenu={<HamburgerMenuUI staff={staff} sessionStatus="success" logoutStatus="idle" onLogout={fn()} />}
    />
  ),
  parameters: { routerPath: "/sales", layout: "fullscreen" },
  decorators: [
    (Story) => (
      <Box h={64}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof HeaderUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { hamburgerMenu: null } };
