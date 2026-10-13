import type { Meta, StoryObj } from "@storybook/react-vite";

import { Wave } from "./wave";

const meta = {
  title: "Shared/Wave",
  component: Wave,
  args: { className: "bg-tomato-3 bg-dashed-grid [--grid-color:var(--tomato-4)]" },
  decorators: [
    (Story, { args }) => (
      <div className="bg-slate-1 pt-18">
        <div className={`relative h-36 ${args.className}`}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Wave>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inverted: Story = {
  args: { className: "bg-tomato-1 bg-dots [--grid-color:var(--slate-8)]", variant: "inverted" },
};
