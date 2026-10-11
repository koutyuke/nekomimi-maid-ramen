import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeMenuUI } from "../../../features/theme";
import { SiteHeaderUI } from "./site-header.ui";

const meta = {
  title: "App/SiteHeader",
  component: SiteHeaderUI,
  args: { themeMenu: <ThemeMenuUI theme="system" onThemeChange={fn()} /> },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeaderUI>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
