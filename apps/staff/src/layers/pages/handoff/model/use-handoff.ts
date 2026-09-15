import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { match } from "ts-pattern";

import { getOrdersRevision, handoffQueries, handoffQueryScopes, kitchenQueryScopes } from "../../../entities/orders";
import { useCookingStateUpdate } from "../../../features/cooking-state";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { currentBusinessDate } from "../../../shared/lib";
import { completeHandoff } from "../api/complete-handoff";
import type { Order, CookingState } from "../../../entities/orders";
import type { PendingCookingLine } from "../../../features/cooking-state";

export type HandoffOrdersState =
  | { status: "pending"; data: undefined }
  | { status: "denied"; data: undefined }
  | { status: "error"; data: readonly Order[] | undefined }
  | { status: "success"; data: readonly Order[] };

type HandoffState = {
  orders: HandoffOrdersState;
  realtimeConnected: boolean;
  retry: () => void;
  cooking: {
    pendingLines: readonly PendingCookingLine[];
    error: string | null;
    update: (orderId: string, menuItemId: string, to: CookingState) => void;
  };
  handoff: {
    pending: boolean;
    error: string | null;
    complete: (orderId: string) => void;
  };
};

export const useHandoff = (): HandoffState => {
  const client = useQueryClient();

  const [businessDate, setBusinessDate] = useState(currentBusinessDate);

  const options = handoffQueries.list(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    checkRevision: getOrdersRevision,
    queryKey: options.queryKey,
    onCheck: () => setBusinessDate(currentBusinessDate()),
  });

  const orders = useQuery({ ...options, enabled: !realtime.denied });
  const refreshOrders = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: handoffQueryScopes.all() }),
      client.invalidateQueries({ queryKey: kitchenQueryScopes.all() }),
    ]);
  };

  const cooking = useCookingStateUpdate(refreshOrders);

  const completing = useRef(false);
  const handoff = useMutation({
    mutationFn: completeHandoff,
    retry: false,
    onSettled: async () => {
      try {
        await refreshOrders();
      } finally {
        completing.current = false;
      }
    },
  });

  const ordersState = match(orders)
    .returnType<HandoffOrdersState>()
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

  const retry = () => {
    const today = currentBusinessDate();
    setBusinessDate(today);
    realtime.retry();
    if (today === businessDate) {
      void orders.refetch();
    }
  };

  const update = (orderId: string, menuItemId: string, to: CookingState) => {
    if (ordersState.status !== "success" || completing.current) {
      return;
    }
    const order = ordersState.data.find((candidate) => candidate.id === orderId);
    const line = order?.lines.find((candidate) => candidate.menuItemId === menuItemId);
    if (!order || order.cancelledAt || order.handedOffAt || !line || line.category !== "drink") {
      return;
    }
    cooking.mutate({ order, line, to });
  };

  const complete = (orderId: string) => {
    if (ordersState.status !== "success" || completing.current) {
      return;
    }
    const order = ordersState.data.find((candidate) => candidate.id === orderId);
    if (
      !order ||
      order.cancelledAt ||
      order.handedOffAt ||
      order.lines.length === 0 ||
      order.cookingState !== "completed" ||
      cooking.isPending(order.id)
    ) {
      return;
    }
    // 再描画前の連打も防ぎ、記録後の注文再取得まで操作を止める。
    completing.current = true;
    handoff.mutate(order);
  };

  return {
    orders: ordersState,
    realtimeConnected: realtime.connected,
    retry,
    cooking: {
      pendingLines: cooking.pendingLines,
      error: cooking.error,
      update,
    },
    handoff: {
      pending: handoff.isPending,
      error: handoff.error?.message ?? null,
      complete,
    },
  };
};
