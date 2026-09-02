import type { Preview } from "@storybook/react-vite";
import { MantineProvider } from "@mantine/core";
import { createElement } from "react";
import { theme } from "../src/theme";
import "@mantine/core/styles.css";

// スタッフも来場者もスマートフォンの縦向きで使うため、既定の枠を合わせる。
const preview: Preview = {
  decorators: [(Story) => createElement(MantineProvider, { theme }, createElement(Story))],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export default preview;
