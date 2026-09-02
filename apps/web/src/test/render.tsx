import { MantineProvider } from "@mantine/core";
import { render as testingLibraryRender } from "@testing-library/react";
import type { ReactNode } from "react";
import { theme } from "../theme";

// Mantineの部品はMantineProviderの外では動かない。試験でも同じ文脈を与える。
export const render = (ui: ReactNode) => testingLibraryRender(<MantineProvider theme={theme}>{ui}</MantineProvider>);
