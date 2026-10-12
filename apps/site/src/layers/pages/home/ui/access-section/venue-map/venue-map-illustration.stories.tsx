import type { Meta, StoryObj } from "@storybook/react-vite";

import { VenueMapIllustration } from "./venue-map-illustration";

const meta = {
  title: "Pages/Home/VenueMapIllustration",
  component: VenueMapIllustration,
  args: { className: "block w-80" },
} satisfies Meta<typeof VenueMapIllustration>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
