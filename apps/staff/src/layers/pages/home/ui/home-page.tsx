import { useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { useAuth } from "../../../features/auth";
import { AuthGuard } from "../../../widgets/auth-guard";
import { HomePageUI } from "./home-page.ui";

const HomePageContent = () => {
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

export const HomePage = () => (
  <AuthGuard unauthenticated="login-prompt">
    <HomePageContent />
  </AuthGuard>
);
