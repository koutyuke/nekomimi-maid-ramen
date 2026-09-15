import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { match } from "ts-pattern";

import { menuQueryScopes } from "../../../entities/menu";
import {
  handoffQueryScopes,
  kitchenQueryScopes,
  getOrdersRevision,
  orderCancellationReason,
  ordersQueries,
  ordersQueryScopes,
} from "../../../entities/orders";
import { staffQueries } from "../../../entities/staff";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { currentBusinessDate } from "../../../shared/lib";
import { cancelOrder } from "../api/cancel-order";
import type { OrderSummary } from "../../../entities/orders";

export type OrderManagementOrdersState =
  | { status: "pending"; data: undefined }
  | { status: "denied"; data: undefined }
  | { status: "error"; data: readonly OrderSummary[] | undefined }
  | { status: "success"; data: readonly OrderSummary[] };

type OrderManagementState = {
  businessDate: string;
  changeBusinessDate: (value: string) => void;
  orders: OrderManagementOrdersState;
  realtimeConnected: boolean;
  retry: () => void;
  cancellation: {
    pending: boolean;
    error: string | null;
    cancelledOrderNumber: number | null;
    cancel: (orderId: string) => void;
  };
};

export const useOrderManagement = (): OrderManagementState => {
  const client = useQueryClient();

  const [businessDate, setBusinessDate] = useState(currentBusinessDate);

  const options = ordersQueries.list(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    queryKey: options.queryKey,
    checkRevision: getOrdersRevision,
  });

  const orders = useQuery({ ...options, enabled: !realtime.denied });

  const submitting = useRef(false);
  const cancellation = useMutation({
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
  const ordersState = match(orders)
    .returnType<OrderManagementOrdersState>()
    .when(
      () => realtime.denied || isAccessDenied(orders.error),
      () => ({ status: "denied", data: undefined }),
    )
    .when(
      () => realtime.failed,
      () => ({ status: "error", data: orders.data }),
    )
    .with({ status: "error" }, ({ data }) => ({ status: "error", data }))
    .with({ status: "pending" }, () => ({ status: "pending", data: undefined }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", data }))
    .exhaustive();

  const changeBusinessDate = (value: string) => {
    if (value && !submitting.current) {
      setBusinessDate(value);
      cancellation.reset();
    }
  };

  const cancel = (orderId: string) => {
    if (ordersState.status !== "success" || submitting.current) {
      return;
    }
    const order = ordersState.data.find((item) => item.id === orderId);
    if (!order || orderCancellationReason(order)) {
      return;
    }
    // 再描画前の連打も防ぎ、取消後の再取得が終わるまで日付変更と取消を止める。
    submitting.current = true;
    cancellation.mutate(order);
  };

  const retry = () => {
    realtime.retry();
    void orders.refetch();
  };

  return {
    businessDate,
    changeBusinessDate,
    orders: ordersState,
    realtimeConnected: realtime.connected,
    retry,
    cancellation: {
      pending: cancellation.isPending,
      error: cancellation.error?.message ?? null,
      cancelledOrderNumber: cancellation.isSuccess ? cancellation.variables.orderNumber : null,
      cancel,
    },
  };
};
