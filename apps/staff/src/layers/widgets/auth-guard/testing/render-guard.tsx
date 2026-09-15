import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { vi } from "vitest";
import type { ComponentType, ReactNode } from "react";

import { render } from "../../../../testing/render-ui";

export const openGuard = (
  Guard: ComponentType<{ children: ReactNode }>,
  content = vi.fn(() => <div>業務データ</div>),
) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Content = content;
  const root = createRootRoute({ errorComponent: () => <div role="alert">業務画面のエラー</div> });
  const login = createRoute({ getParentRoute: () => root, path: "/", component: () => <div>ログイン画面</div> });
  const protectedRoute = createRoute({
    getParentRoute: () => root,
    path: "/protected",
    component: () => (
      <Guard>
        <Content />
      </Guard>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([login, protectedRoute]),
    history: createMemoryHistory({ initialEntries: ["/protected"] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { client, router, content };
};
