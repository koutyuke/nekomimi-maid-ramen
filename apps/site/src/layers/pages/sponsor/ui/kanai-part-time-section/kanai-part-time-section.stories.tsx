import type { Meta, StoryObj } from "@storybook/react-vite";

import { KanaiPartTimeSection } from "./kanai-part-time-section";

const meta = {
  title: "Pages/Sponsor/KanaiPartTimeSection",
  component: KanaiPartTimeSection,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof KanaiPartTimeSection>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
