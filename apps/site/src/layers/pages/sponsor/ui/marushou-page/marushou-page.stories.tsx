import type { Meta, StoryObj } from "@storybook/react-vite";

import { MarushouPage } from "./marushou-page";

const meta = {
  title: "Pages/Sponsor/MarushouPage",
  component: MarushouPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MarushouPage>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
