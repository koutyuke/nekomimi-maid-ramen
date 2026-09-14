import { Outlet } from "@tanstack/react-router";

import { AdminGuard, AuthGuard } from "../../widgets/auth-guard";

export const AuthenticatedLayout = () => (
  <AuthGuard>
    <Outlet />
  </AuthGuard>
);

export const AdminAuthenticatedLayout = () => (
  <AdminGuard>
    <Outlet />
  </AdminGuard>
);
