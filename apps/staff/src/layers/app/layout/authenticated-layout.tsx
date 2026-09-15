import { AppShell } from "@mantine/core";
import { Outlet, useLocation } from "@tanstack/react-router";

import { AuthGuard, PermissionGuard } from "../../widgets/auth-guard";
import { Footer, Header } from "../../widgets/layout";

export const AuthenticatedLayout = () => {
  const isHome = useLocation({ select: (location) => location.pathname === "/" });
  return (
    <AppShell header={{ height: 64 }} mih="100dvh" display="flex" style={{ flexDirection: "column" }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main flex={1}>
        <AuthGuard unauthenticated={isHome ? "login-prompt" : "redirect"}>
          <Outlet />
        </AuthGuard>
      </AppShell.Main>
      <Footer />
    </AppShell>
  );
};

export const StaffPermissionLayout = () => (
  <PermissionGuard permission="Staff">
    <Outlet />
  </PermissionGuard>
);

export const AdminPermissionLayout = () => (
  <PermissionGuard permission="Admin">
    <Outlet />
  </PermissionGuard>
);
