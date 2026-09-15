import { queryOptions } from "@tanstack/react-query";

import { getOrders } from "./get-orders";

export const kitchenQueryScopes = { all: () => ["kitchen"] as const };

export const kitchenQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...kitchenQueryScopes.all(), "list", businessDate],
      queryFn: ({ signal }) =>
        getOrders({ businessDate }, signal, "調理注文を取得できませんでした。権限と通信状況を確認してください。"),
      select: (snapshot) => snapshot.data,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      retry: false,
    }),
};
