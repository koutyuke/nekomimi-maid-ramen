import { queryOptions } from "@tanstack/react-query";

import { getHandoffOrders } from "./get-handoff-orders";

export const handoffQueryScopes = { all: () => ["handoff"] as const };
export const handoffQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...handoffQueryScopes.all(), "list", businessDate] as const,
      queryFn: () => getHandoffOrders(businessDate),
      staleTime: 0,
      retry: false,
    }),
};
