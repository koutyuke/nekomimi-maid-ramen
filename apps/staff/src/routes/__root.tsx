import { createRootRoute, Outlet } from "@tanstack/react-router";

import { Layout } from "../layers/widgets/layout";

const RootLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export const Route = createRootRoute({ component: RootLayout });
