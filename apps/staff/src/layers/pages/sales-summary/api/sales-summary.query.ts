import { queryOptions } from "@tanstack/react-query";

import { getSalesSummary } from "./get-sales-summary";

export const salesSummaryQuery = (businessDate: string) =>
  queryOptions({
    queryKey: ["sales-summary", businessDate] as const,
    queryFn: ({ signal }) => getSalesSummary(businessDate, signal),
    select: (snapshot) => snapshot.data,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
    retry: false,
  });
