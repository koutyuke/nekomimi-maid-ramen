import { queryOptions } from "@tanstack/react-query";

import { getOrders } from "./get-orders";

export const ordersQueryScopes = { all: () => ["orders"] as const };

export const ordersQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...ordersQueryScopes.all(), "list", businessDate] as const,
      queryFn: ({ signal }) =>
        getOrders(
          { businessDate, includeCancelled: true },
          signal,
          "注文を取得できませんでした。権限と通信状況を確認してください。",
        ),
      select: (snapshot) => snapshot.data,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      retry: false,
    }),
};
