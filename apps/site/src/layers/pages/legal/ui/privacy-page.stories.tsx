import type { Meta, StoryObj } from "@storybook/react-vite";

import { PrivacyPage } from "./privacy-page";

const meta = {
  title: "Pages/Legal/PrivacyPage",
  component: PrivacyPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PrivacyPage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
