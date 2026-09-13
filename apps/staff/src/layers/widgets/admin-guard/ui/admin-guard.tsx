import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { staffQueries } from "../../../entities/staff";
import { AdminGuardUI } from "./admin-guard.ui";

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const staff = useQuery(staffQueries.current());
  const access = staff.isPending
    ? ("loading" as const)
    : staff.isError
      ? ("error" as const)
      : staff.data?.role === "Owner" || staff.data?.role === "Admin"
        ? ("allowed" as const)
        : ("denied" as const);

  return (
    <AdminGuardUI access={access} onRetry={() => void staff.refetch()}>
      {children}
    </AdminGuardUI>
  );
};
