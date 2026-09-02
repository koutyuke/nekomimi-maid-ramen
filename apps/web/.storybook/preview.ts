import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

// スタッフも来場者もスマートフォンの縦向きで使うため、既定の枠を合わせる。
const preview: Preview = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export default preview;
