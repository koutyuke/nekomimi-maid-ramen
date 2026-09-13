import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { handoffQueryScopes } from "../../../entities/handoff";
import { kitchenQueryScopes } from "../../../entities/kitchen";
import { menuQueryScopes } from "../../../entities/menu";
import { getOrdersRevision, orderCancellationReason, ordersQueries, ordersQueryScopes } from "../../../entities/orders";
import { staffQueries } from "../../../entities/staff";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { currentBusinessDate } from "../../../shared/lib";
import { cancelOrder } from "../api/cancel-order";
import type { OrderSummary } from "../../../entities/orders";

export const useOrderManagement = () => {
  const client = useQueryClient();
  const staff = useQuery(staffQueries.current());

  const [businessDate, setBusinessDate] = useState(currentBusinessDate);

  const options = ordersQueries.list(businessDate);
  const hasRole = !staff.isError && !!staff.data && staff.data.role !== "None";
  const realtime = useRealtime({
    scope: "orders",
    queryKey: options.queryKey,
    checkRevision: getOrdersRevision,
    enabled: hasRole,
  });

  const allowed = hasRole && !realtime.denied;
  const orders = useQuery({ ...options, enabled: allowed });

  const submitting = useRef(false);
  const cancel = useMutation({
    mutationFn: cancelOrder,
    retry: false,
    onError: (error) => {
      if (isAccessDenied(error)) {
        void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
      }
    },
    onSettled: async () => {
      try {
        await Promise.all(
          [ordersQueryScopes.all(), menuQueryScopes.all(), kitchenQueryScopes.all(), handoffQueryScopes.all()].map(
            (queryKey) => client.invalidateQueries({ queryKey }),
          ),
        );
      } finally {
        submitting.current = false;
      }
    },
  });
  const failed = orders.isError || realtime.failed || realtime.denied;

  return {
    access: staff.isPending
      ? ("loading" as const)
      : staff.isError
        ? ("error" as const)
        : allowed
          ? ("allowed" as const)
          : ("denied" as const),
    businessDate,
    connected: realtime.connected,
    orders: allowed ? (orders.data ?? []) : [],
    loading: orders.isPending,
    failed,
    pending: cancel.isPending,
    error: cancel.error?.message ?? null,
    cancelledOrderNumber: cancel.isSuccess ? cancel.variables.orderNumber : null,
    actions: {
      onBusinessDateChange: (value: string) => {
        if (value && !submitting.current) {
          setBusinessDate(value);
          cancel.reset();
        }
      },
      onCancel: (order: OrderSummary) => {
        const current = orders.data?.find((item) => item.id === order.id);
        if (
          !allowed ||
          failed ||
          orders.isPending ||
          submitting.current ||
          !current ||
          orderCancellationReason(current)
        ) {
          return;
        }
        submitting.current = true;
        cancel.mutate(current);
      },
      onRetry: () => {
        realtime.retry();
        if (allowed) {
          void orders.refetch();
        }
        void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
      },
    },
  };
};
