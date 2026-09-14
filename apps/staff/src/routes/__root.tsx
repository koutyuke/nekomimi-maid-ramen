import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AuthGuard } from "../layers/widgets/auth-guard";
import { Layout } from "../layers/widgets/layout";

const RootLayout = () => (
  <Layout>
    <AuthGuard unauthenticated="login-prompt">
      <Outlet />
    </AuthGuard>
  </Layout>
);

export const Route = createRootRoute({ component: RootLayout });
