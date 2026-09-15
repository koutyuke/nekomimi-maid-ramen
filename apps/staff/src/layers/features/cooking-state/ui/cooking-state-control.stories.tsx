import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CookingStateControlUI } from "./cooking-state-control.ui";

const line = {
  menuItemId: "ramen",
  name: "猫耳ラーメン",
  quantity: 2,
  category: "main" as const,
  cookingState: "unstarted" as const,
};

const meta = {
  component: CookingStateControlUI,
  title: "Features/CookingState/CookingStateControl",
  args: {
    line,
    orderNumber: 12,
    editable: true,
    disabled: false,
    onUpdate: fn(),
  },
} satisfies Meta<typeof CookingStateControlUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unstarted: Story = {};
export const Cooking: Story = { args: { line: { ...line, cookingState: "cooking" } } };
export const Completed: Story = { args: { line: { ...line, cookingState: "completed" } } };
export const Readonly: Story = { args: { editable: false } };
export const Disabled: Story = { args: { disabled: true } };
