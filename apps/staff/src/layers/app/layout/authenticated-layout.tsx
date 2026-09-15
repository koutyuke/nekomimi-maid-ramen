import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AuthGuard } from "../../widgets/auth-guard";

export const HomeAuthenticatedLayout = ({ children }: { children: ReactNode }) => (
  <AuthGuard unauthenticated="login-prompt">{children}</AuthGuard>
);

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
