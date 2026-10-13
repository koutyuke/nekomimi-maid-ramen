import type { Meta, StoryObj } from "@storybook/react-vite";

import { SponsorSection } from "./sponsor-section";

const meta = {
  title: "Pages/Home/SponsorSection",
  component: SponsorSection,
  decorators: [
    (Story) => (
      <div className="bg-slate-6 pt-18">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SponsorSection>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
