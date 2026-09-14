import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthErrorUI } from "./auth-error.ui";

const meta = {
  title: "Widgets/AuthGuard/AuthError",
  component: AuthErrorUI,
  args: { onRetry: fn() },
} satisfies Meta<typeof AuthErrorUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
