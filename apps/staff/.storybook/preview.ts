import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement, useState } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";

import { theme } from "../src/layers/app/styles";

// 表示だけを切り替え、本番の経路やローダーへ接続しない。
const withRouter: Decorator = (Story, context) => {
  const [router] = useState(() => {
    const root = createRootRoute();
    const routeTree = root.addChildren([createRoute({ getParentRoute: () => root, path: "$" })]);
    return createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [context.parameters["routerPath"] ?? "/"] }),
      defaultPreload: false,
    });
  });
  return createElement(RouterProvider, { router, defaultComponent: Story });
};

// スタッフも来場者もスマートフォンの縦向きで使うため、既定の枠を合わせる。
const preview: Preview = {
  decorators: [withRouter, (Story) => createElement(MantineProvider, { theme }, createElement(Story))],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export default preview;
