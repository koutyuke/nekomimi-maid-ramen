import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { STAFF_ROLE_PRIORITY, staffQueries } from "../../../entities/staff";
import { AccessDeniedUI } from "./access-denied/access-denied.ui";
import type { StaffRole } from "../../../entities/staff";

type PermissionGuardProps = {
  children: ReactNode;
  permission: StaffRole;
};

export const PermissionGuard = ({ children, permission }: PermissionGuardProps) => {
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  if (!staff) {
    return null;
  }
  return STAFF_ROLE_PRIORITY[staff.role] <= STAFF_ROLE_PRIORITY[permission] ? children : <AccessDeniedUI />;
};
