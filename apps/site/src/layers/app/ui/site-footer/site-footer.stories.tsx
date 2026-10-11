import type { Meta, StoryObj } from "@storybook/react-vite";

import { SiteFooter } from "./site-footer";

const meta = {
  title: "App/SiteFooter",
  component: SiteFooter,
  // 上端の波を見せるため、上に余白を取る。
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
