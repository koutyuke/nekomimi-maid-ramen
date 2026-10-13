import "./layers/app/styles/global.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// 経路の`head`が同じタグを描画するため、初期HTMLのメタ情報を取り除く。
for (const element of document.head.querySelectorAll("[data-page-head]")) {
  element.remove();
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("#root が見つからない");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
