import { queryOptions } from "@tanstack/react-query";

import { getKitchenOrders } from "./get-kitchen-orders";

export const kitchenQueryScopes = { all: () => ["kitchen"] as const };
export const kitchenQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...kitchenQueryScopes.all(), "list", businessDate],
      queryFn: () => getKitchenOrders(businessDate),
      staleTime: 0,
      retry: false,
    }),
};
