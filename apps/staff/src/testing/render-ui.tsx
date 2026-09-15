import { MantineProvider } from "@mantine/core";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";

import { theme } from "../layers/app/styles";

export const render = (ui: ReactNode) =>
  testingLibraryRender(ui, {
    wrapper: ({ children }) => <MantineProvider theme={theme}>{children}</MantineProvider>,
  });
