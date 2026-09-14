import { Outlet } from "@tanstack/react-router";

import { AuthGuard } from "../../widgets/auth-guard";

export const StaffAuthenticatedLayout = () => (
  <AuthGuard permission="Staff">
    <Outlet />
  </AuthGuard>
);

export const AdminAuthenticatedLayout = () => (
  <AuthGuard permission="Admin">
    <Outlet />
  </AuthGuard>
);
