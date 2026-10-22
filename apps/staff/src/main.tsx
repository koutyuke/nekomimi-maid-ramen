import "@mantine/core/styles.css";
// Mantineの指定どおり、通知と日付入力の見た目はコアの後に読み込む。
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProvider } from "./layers/app/providers";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("#root が見つからない");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
);
