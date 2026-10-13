import type { Meta, StoryObj } from "@storybook/react-vite";

import ScribbleArrow from "./scribble-arrow.svg?react";

const meta = {
  title: "Shared/ScribbleArrow",
  component: ScribbleArrow,
  args: { className: "h-12 w-5 text-slate-11" },
} satisfies Meta<typeof ScribbleArrow>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
