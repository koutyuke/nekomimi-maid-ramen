import { useSuspenseQuery } from "@tanstack/react-query";
import type { ComponentProps, ReactNode } from "react";

import { staffQueries } from "../../../entities/staff";
import { AccessDeniedUI } from "./access-denied/access-denied.ui";
import { AuthGuard } from "./auth-guard";

type AdminAccessProps = {
  children: ReactNode;
};

const AdminAccess = ({ children }: AdminAccessProps) => {
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  if (staff?.role === "Owner" || staff?.role === "Admin") {
    return children;
  }

  return <AccessDeniedUI />;
};

export const AdminGuard = ({ children, unauthenticated = "redirect" }: ComponentProps<typeof AuthGuard>) => (
  <AuthGuard unauthenticated={unauthenticated}>
    <AdminAccess>{children}</AdminAccess>
  </AuthGuard>
);
