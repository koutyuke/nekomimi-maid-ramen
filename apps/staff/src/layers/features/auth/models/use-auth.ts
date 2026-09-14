import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { login } from "../api/login";
import { logout } from "../api/logout";

export const useAuth = () => {
  const queryClient = useQueryClient();

  const staff = useQuery(staffQueries.current());

  const loginMutation = useMutation({ mutationFn: login });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      const session = queryClient.getQueryCache().find({ queryKey: staffQueries.current().queryKey, exact: true });
      // 認証を監視する部品との接続を保ち、前の担当者の業務データだけを破棄する。
      queryClient.setQueryData(staffQueries.current().queryKey, null);
      queryClient.removeQueries({ predicate: (query) => query !== session });
      queryClient.getMutationCache().clear();
      await staff.refetch();
    },
  });

  return {
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  };
};
