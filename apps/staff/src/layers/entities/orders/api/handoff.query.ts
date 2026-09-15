import { queryOptions } from "@tanstack/react-query";

import { getOrders } from "./get-orders";

export const handoffQueryScopes = { all: () => ["handoff"] as const };

export const handoffQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...handoffQueryScopes.all(), "list", businessDate] as const,
      queryFn: ({ signal }) =>
        getOrders({ businessDate }, signal, "受け渡し注文を取得できませんでした。権限と通信状況を確認してください。"),
      select: (snapshot) => snapshot.data,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      retry: false,
    }),
};
