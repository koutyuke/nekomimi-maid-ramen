import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthLoadingUI } from "./auth-loading.ui";

const meta = {
  title: "Widgets/AuthGuard/AuthLoading",
  component: AuthLoadingUI,
} satisfies Meta<typeof AuthLoadingUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
