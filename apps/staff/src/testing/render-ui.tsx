import { MantineProvider } from "@mantine/core";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";

import { theme } from "../layers/app/styles";

// `env="test"`でMantineの遷移や表示位置の判定を止め、jsdomでも開いた選択肢をすぐ操作できるようにする。
export const render = (ui: ReactNode) =>
  testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <MantineProvider env="test" theme={theme}>
        {children}
      </MantineProvider>
    ),
  });
