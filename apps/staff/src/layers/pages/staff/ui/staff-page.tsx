import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { signIn, signOut } from "../../../features/staff-auth";
import { StaffPageUI } from "./staff-page.ui";

export const StaffPage = () => {
  const queryClient = useQueryClient();
  const staff = useQuery(staffQueries.current());
  const login = useMutation({ mutationFn: signIn });
  const logout = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      queryClient.clear();
      await staff.refetch();
    },
  });

  return (
    <StaffPageUI
      staff={staff.data ?? null}
      loading={staff.isPending}
      failed={staff.isError}
      actionFailed={login.isError || logout.isError}
      busy={login.isPending || logout.isPending}
      loginFailed={new URLSearchParams(window.location.search).has("error")}
      actions={{
        onSignIn: () => login.mutate(),
        onSignOut: () => logout.mutate(),
        onRetry: () => {
          void staff.refetch();
        },
      }}
    />
  );
};
