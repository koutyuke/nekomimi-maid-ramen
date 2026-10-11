import type { Meta, StoryObj } from "@storybook/react-vite";

import { SiteHeader } from "./site-header";

const meta = {
  title: "公開サイト/ヘッダー",
  component: SiteHeader,
} satisfies Meta<typeof SiteHeader>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
