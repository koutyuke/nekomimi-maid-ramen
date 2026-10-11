import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomePage } from "./home-page";

const meta = {
  title: "Pages/Home/HomePage",
  component: HomePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
