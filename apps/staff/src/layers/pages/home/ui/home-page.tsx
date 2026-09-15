import { useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { useLogout } from "../../../features/auth";
import { HomePageUI } from "./home-page.ui";

export const HomePage = () => {
  const staff = useSuspenseQuery(staffQueries.current());
  const logoutMutation = useLogout();

  if (staff.data === null) {
    return null;
  }

  return (
    <HomePageUI
      staff={staff.data}
      logoutStatus={logoutMutation.status}
      onRetry={() => void staff.refetch()}
      onLogout={() => logoutMutation.mutate()}
    />
  );
};
