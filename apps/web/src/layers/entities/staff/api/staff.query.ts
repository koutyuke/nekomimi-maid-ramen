import { queryOptions } from "@tanstack/react-query";

import { api } from "../../../shared/api";

export const staffQueryScopes = {
  all: () => ["staff"] as const,
};

export const staffQueries = {
  list: () =>
    queryOptions({
      queryKey: [...staffQueryScopes.all(), "list"] as const,
      queryFn: async () => {
        const { data, error } = await api.staff.get();
        if (error) {
          throw new Error("利用者一覧を取得できませんでした。");
        }
        return data.staff;
      },
      staleTime: 0,
      retry: false,
    }),
  current: () =>
    queryOptions({
      queryKey: [...staffQueryScopes.all(), "current"] as const,
      queryFn: async () => {
        const { data, error } = await api.auth.session.get();
        if (error) {
          throw new Error("ログイン状態を確認できませんでした。");
        }
        return data.staff;
      },
      staleTime: 0,
      retry: false,
    }),
};
