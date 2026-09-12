import { queryOptions } from "@tanstack/react-query";

import { getKitchenOrders } from "./get-kitchen-orders";

export const kitchenQueryScopes = { all: () => ["kitchen"] as const };
export const kitchenQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...kitchenQueryScopes.all(), "list", businessDate],
      queryFn: ({ signal }) => getKitchenOrders(businessDate, signal),
      select: (snapshot) => snapshot.data,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      retry: false,
    }),
};
