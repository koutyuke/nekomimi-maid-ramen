import "../src/layers/app/styles/global.css";

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createElement, useState } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";

// 部品内の`Link`を描画するためのRouterであり、本番の経路へ接続しない。
const withRouter: Decorator = (Story) => {
  const [router] = useState(() => {
    const root = createRootRoute();
    const routeTree = root.addChildren([createRoute({ getParentRoute: () => root, path: "$" })]);
    return createRouter({ routeTree, history: createMemoryHistory(), defaultPreload: false });
  });
  return createElement(RouterProvider, { router, defaultComponent: Story });
};

const preview: Preview = { decorators: [withRouter], parameters: { layout: "padded" } };
export default preview;
