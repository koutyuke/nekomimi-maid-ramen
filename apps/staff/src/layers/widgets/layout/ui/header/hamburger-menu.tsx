import { useQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../../entities/staff";
import { useLogout } from "../../../../features/auth";
import { HamburgerMenuUI } from "./hamburger-menu.ui";

export const HamburgerMenu = () => {
  const session = useQuery(staffQueries.current());
  const logout = useLogout();

  return (
    <HamburgerMenuUI
      staff={session.data ?? null}
      sessionStatus={session.status}
      logoutStatus={logout.status}
      onLogout={() => logout.mutate()}
    />
  );
};
