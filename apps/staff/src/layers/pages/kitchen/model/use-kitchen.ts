import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

import { getOrdersRevision, kitchenQueries, kitchenQueryScopes } from "../../../entities/orders";
import { useCookingStateUpdate } from "../../../features/cooking-state";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { currentBusinessDate } from "../../../shared/lib";
import type { Order, CookingState } from "../../../entities/orders";
import type { PendingCookingLine } from "../../../features/cooking-state";

export type KitchenOrdersState =
  | { status: "pending"; data: undefined }
  | { status: "denied"; data: undefined }
  | { status: "error"; data: readonly Order[] | undefined }
  | { status: "success"; data: readonly Order[] };

type KitchenState = {
  orders: KitchenOrdersState;
  realtimeConnected: boolean;
  retry: () => void;
  cooking: {
    pendingLines: readonly PendingCookingLine[];
    error: string | null;
    update: (orderId: string, menuItemId: string, to: CookingState) => void;
  };
};

export const useKitchen = (): KitchenState => {
  const client = useQueryClient();
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);
  const options = kitchenQueries.list(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    checkRevision: getOrdersRevision,
    queryKey: options.queryKey,
    onCheck: () => setBusinessDate(currentBusinessDate()),
  });
  const orders = useQuery({ ...options, enabled: !realtime.denied });
  const cooking = useCookingStateUpdate(() => client.invalidateQueries({ queryKey: kitchenQueryScopes.all() }));

  const ordersState = match(orders)
    .returnType<KitchenOrdersState>()
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
    if (ordersState.status !== "success") {
      return;
    }
    const order = ordersState.data.find((candidate) => candidate.id === orderId);
    const line = order?.lines.find((candidate) => candidate.menuItemId === menuItemId);
    if (!order || order.cancelledAt || order.handedOffAt || !line || line.category === "drink") {
      return;
    }
    cooking.mutate({ order, line, to });
  };

  return {
    orders: ordersState,
    realtimeConnected: realtime.connected,
    retry,
    cooking: { pendingLines: cooking.pendingLines, error: cooking.error, update },
  };
};
