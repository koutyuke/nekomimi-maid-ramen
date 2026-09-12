import { queryOptions } from "@tanstack/react-query";

import { getHandoffOrders } from "./get-handoff-orders";

export const handoffQueryScopes = { all: () => ["handoff"] as const };

export const handoffQueries = {
  list: (businessDate: string) =>
    queryOptions({
      queryKey: [...handoffQueryScopes.all(), "list", businessDate] as const,
      queryFn: ({ signal }) => getHandoffOrders(businessDate, signal),
      select: (snapshot) => snapshot.data,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      retry: false,
    }),
};
