import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccessSection } from "./access-section";

const meta = {
  title: "Pages/Home/AccessSection",
  component: AccessSection,
  decorators: [
    (Story) => (
      <div className="bg-slate-6 pt-18">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AccessSection>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
