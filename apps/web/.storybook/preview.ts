import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { createElement } from "react";
import type { Preview } from "@storybook/react-vite";

import { theme } from "../src/theme";

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
