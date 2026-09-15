import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginPromptUI } from "./login-prompt.ui";

const meta = {
  title: "Widgets/AuthGuard/LoginPrompt",
  component: LoginPromptUI,
  args: { busy: false, loginFailed: false, onLogin: fn() },
} satisfies Meta<typeof LoginPromptUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Busy: Story = { args: { busy: true } };
export const Failed: Story = { args: { loginFailed: true } };
