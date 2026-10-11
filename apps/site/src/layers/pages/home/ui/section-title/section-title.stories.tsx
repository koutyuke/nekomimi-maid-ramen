import type { Meta, StoryObj } from "@storybook/react-vite";

import { SectionTitle } from "./section-title";

const meta = {
  title: "Pages/Home/SectionTitle",
  component: SectionTitle,
  args: { children: "お料理" },
  decorators: [
    (Story) => (
      <div className="bg-tomato-3 p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionTitle>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
