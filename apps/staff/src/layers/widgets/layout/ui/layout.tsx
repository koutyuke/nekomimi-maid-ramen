import { Box } from "@mantine/core";
import type { ReactNode } from "react";

// import { Footer } from "./footer";
// import { Header } from "./header";

export const Layout = ({ children }: { children: ReactNode }) => (
  <Box mih="100dvh" display="flex" style={{ flexDirection: "column" }}>
    {/*<Header />*/}
    <Box component="main" style={{ flex: 1 }}>
      {children}
    </Box>
    {/*<Footer />*/}
  </Box>
);
