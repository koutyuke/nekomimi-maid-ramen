import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getHandoffRevision } from "../../../entities/handoff";
import { handoffQueries, handoffQueryScopes } from "../../../entities/handoff";
import { kitchenQueryScopes, useCookingStateUpdate } from "../../../entities/kitchen";
import { staffQueries } from "../../../entities/staff";
import { useRealtime } from "../../../features/sync-data";
import { currentBusinessDate } from "../../../shared/lib";
import { completeHandoff } from "../api/complete-handoff";
import type { HandoffOrder, HandoffOrderLine } from "../../../entities/handoff";
import type { CookingState } from "../../../entities/kitchen";

export const useHandoff = () => {
  const client = useQueryClient();
  const staff = useQuery(staffQueries.current());
  const hasRole = !staff.isError && !!staff.data && staff.data.role !== "None";
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);
  const options = handoffQueries.list(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    checkRevision: getHandoffRevision,
    queryKey: options.queryKey,
    enabled: hasRole,
    onCheck: () => setBusinessDate(currentBusinessDate()),
  });
  const allowed = hasRole && !realtime.denied;
  const orders = useQuery({ ...options, enabled: allowed });
  const refreshOrders = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: handoffQueryScopes.all() }),
      client.invalidateQueries({ queryKey: kitchenQueryScopes.all() }),
    ]);
  };
  const update = useCookingStateUpdate(refreshOrders);
  const complete = useMutation({ mutationFn: completeHandoff, retry: false, onSettled: refreshOrders });

  const ready = !realtime.failed && !orders.isError && !orders.isPending && !complete.isPending;

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
    pending: complete.isPending,
    pendingLines: update.pendingLines,
    error: update.error ?? complete.error?.message ?? null,
    actions: {
      onUpdate: (order: HandoffOrder, line: HandoffOrderLine, to: CookingState) => {
        const currentOrder = orders.data?.find((candidate) => candidate.id === order.id);
        const currentLine = currentOrder?.lines.find((candidate) => candidate.menuItemId === line.menuItemId);
        if (allowed && ready && currentOrder && !currentOrder.handedOffAt && currentLine?.category === "drink") {
          update.mutate({ order: currentOrder, line: currentLine, to });
        }
      },
      onComplete: (order: HandoffOrder) => {
        const current = orders.data?.find((candidate) => candidate.id === order.id);
        if (
          allowed &&
          ready &&
          current &&
          !update.isPending(current.id) &&
          current.lines.length > 0 &&
          current.cookingState === "completed" &&
          !current.cancelledAt &&
          !current.handedOffAt
        ) {
          complete.mutate(current);
        }
      },
      onRetry: () => {
        realtime.retry();
        setBusinessDate(currentBusinessDate());
        void staff.refetch();
        if (allowed) {
          void orders.refetch();
        }
      },
    },
  };
};
