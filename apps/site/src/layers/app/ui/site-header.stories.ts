import type { AstroRenderer } from "@storybook-astro/framework";
import type { ComponentAnnotations, StoryAnnotations } from "storybook/internal/types";

import { setupTheme } from "../../features/theme";
import SiteHeader from "./site-header.astro";

const meta = {
  title: "公開サイト/ヘッダー",
  component: SiteHeader,
} satisfies ComponentAnnotations<AstroRenderer>;
export default meta;

export const Default: StoryAnnotations<AstroRenderer> = {
  play: ({ canvasElement }) => {
    const select = canvasElement.querySelector<HTMLSelectElement>("#theme");
    if (select) {
      setupTheme(select);
    }
  },
};
