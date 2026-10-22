import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { createMemoryHistory, createRouter, RouterContextProvider } from "@tanstack/react-router";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";

import { theme } from "../layers/app/styles";
import { routeTree } from "../routeTree.gen";

// Mantineとルーターの部品はProviderの外では動かない。試験でも同じ文脈を与える。
// `env="test"`でMantineの遷移や表示位置の判定を止め、jsdomでも開いた選択肢をすぐ操作できるようにする。
export const render = (ui: ReactNode) => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <RouterContextProvider router={router}>
        <MantineProvider env="test" theme={theme}>
          <Notifications />
          {children}
        </MantineProvider>
      </RouterContextProvider>
    ),
  });
};
