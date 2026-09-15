import { useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { useAuth } from "../../../features/auth";
import { HomePageUI } from "./home-page.ui";

export const HomePage = () => {
  const staff = useSuspenseQuery(staffQueries.current());
  const { logout, logoutError, logoutPending } = useAuth();

  if (staff.data === null) {
    return null;
  }

  return (
    <HomePageUI
      staff={staff.data}
      logoutError={logoutError}
      logoutPending={logoutPending}
      onRetry={() => void staff.refetch()}
      onLogout={logout}
    />
  );
};
