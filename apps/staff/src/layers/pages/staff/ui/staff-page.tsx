import { useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { useAuth } from "../../../features/auth";
import { StaffPageUI } from "./staff-page.ui";

export const StaffPage = () => {
  const staff = useSuspenseQuery(staffQueries.current());
  const { logout } = useAuth();

  if (staff.data === null) {
    return null;
  }

  return <StaffPageUI staff={staff.data} onRetry={() => void staff.refetch()} onLogout={logout} />;
};
