import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { logout } from "../api/logout";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const staff = useQuery(staffQueries.current());

  return useMutation({
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
};
