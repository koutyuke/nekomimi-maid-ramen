import { queryOptions } from "@tanstack/react-query";

import { api } from "../../../shared/api";

export const staffQueries = {
  current: () =>
    queryOptions({
      queryKey: ["staff", "current"],
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
