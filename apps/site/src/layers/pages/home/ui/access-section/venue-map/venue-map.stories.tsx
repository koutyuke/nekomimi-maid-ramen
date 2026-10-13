import type { Meta, StoryObj } from "@storybook/react-vite";

import { VenueMap } from "./venue-map";

const meta = {
  title: "Pages/Home/VenueMap",
  component: VenueMap,
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
