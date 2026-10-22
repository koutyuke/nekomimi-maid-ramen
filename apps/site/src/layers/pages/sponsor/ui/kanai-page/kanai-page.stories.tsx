import type { Meta, StoryObj } from "@storybook/react-vite";

import { KanaiPage } from "./kanai-page";

const meta = {
  title: "Pages/Sponsor/KanaiPage",
  component: KanaiPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof KanaiPage>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
