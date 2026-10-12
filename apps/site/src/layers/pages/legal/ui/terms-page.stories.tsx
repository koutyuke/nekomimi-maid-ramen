import type { Meta, StoryObj } from "@storybook/react-vite";

import { TermsPage } from "./terms-page";

const meta = {
  title: "Pages/Legal/TermsPage",
  component: TermsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TermsPage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
