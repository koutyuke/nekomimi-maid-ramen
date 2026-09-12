import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getKitchenRevision } from "../../../entities/kitchen";
import { kitchenQueries, kitchenQueryScopes, useCookingStateUpdate } from "../../../entities/kitchen";
import { staffQueries } from "../../../entities/staff";
import { useRealtime } from "../../../features/sync-data";
import { currentBusinessDate } from "../../../shared/business-date";
import type { KitchenOrder, KitchenOrderLine, CookingState } from "../../../entities/kitchen";

export const useKitchen = () => {
  const client = useQueryClient();
  const staff = useQuery(staffQueries.current());
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);

  const hasRole = !staff.isError && !!staff.data && staff.data.role !== "None";

  const options = kitchenQueries.list(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    checkRevision: getKitchenRevision,
    queryKey: options.queryKey,
    enabled: hasRole,
    onCheck: () => setBusinessDate(currentBusinessDate()),
  });

  const allowed = hasRole && !realtime.denied;
  const orders = useQuery({ ...options, enabled: allowed });
  const update = useCookingStateUpdate(() => client.invalidateQueries({ queryKey: kitchenQueryScopes.all() }));

  return {
    access: staff.isPending
      ? ("loading" as const)
      : staff.isError
        ? ("error" as const)
        : allowed
          ? ("allowed" as const)
          : ("denied" as const),
    orders: allowed ? (orders.data ?? []) : [],
    loading: orders.isPending,
    failed: orders.isError || realtime.failed,
    connected: allowed && realtime.connected,
    pendingLines: update.pendingLines,
    error: update.error,
    actions: {
      onRetry: () => {
        realtime.retry();
        setBusinessDate(currentBusinessDate());
        void staff.refetch();
        if (allowed) {
          void orders.refetch();
        }
      },
      onUpdate: (order: KitchenOrder, line: KitchenOrderLine, to: CookingState) => {
        if (allowed && !realtime.failed && !orders.isError && !orders.isPending) {
          update.mutate({ order, line, to });
        }
      },
    },
  };
};
