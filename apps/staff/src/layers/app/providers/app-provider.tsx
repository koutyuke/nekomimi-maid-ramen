import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";

import { queryClient } from "../store";
import { theme } from "../styles";

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <JotaiProvider>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    </QueryClientProvider>
  </JotaiProvider>
);
