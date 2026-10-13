import type { Meta, StoryObj } from "@storybook/react-vite";

import { SiteFooter } from "./site-footer";

const meta = {
  title: "Widgets/Layout/SiteFooter",
  component: SiteFooter,
  decorators: [
    (Story) => (
      <div className="bg-slate-6 pt-18">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
