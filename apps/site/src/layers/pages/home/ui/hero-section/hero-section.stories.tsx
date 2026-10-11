import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeroSection } from "./hero-section";

const meta = {
  title: "Pages/Home/HeroSection",
  component: HeroSection,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HeroSection>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
