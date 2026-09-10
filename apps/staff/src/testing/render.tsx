import { MantineProvider } from "@mantine/core";
import { createMemoryHistory, createRouter, RouterContextProvider } from "@tanstack/react-router";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";

import { theme } from "../layers/app/styles";
import { routeTree } from "../routeTree.gen";

// Mantineとルーターの部品はProviderの外では動かない。試験でも同じ文脈を与える。
export const render = (ui: ReactNode) => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </RouterContextProvider>
    ),
  });
};
