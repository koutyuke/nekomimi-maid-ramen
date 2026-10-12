import type { Meta, StoryObj } from "@storybook/react-vite";

import { VenueMap } from "./venue-map";

const meta = {
  title: "Pages/Home/VenueMap",
  component: VenueMap,
  // 「Here」の注記が地図の上にはみ出すため、上に余白を取る。
  decorators: [
    (Story) => (
      <div className="pt-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VenueMap>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
