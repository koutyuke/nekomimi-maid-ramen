import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  cookingStateLabels,
  kitchenQueries,
  kitchenQueryScopes,
  subscribeKitchenOrders,
  updateCookingState,
} from "../../../entities/kitchen";
import { staffQueries } from "../../../entities/staff";
import { currentBusinessDate } from "../../../shared/business-date";
import type { KitchenOrder, KitchenOrderLine, CookingState } from "../../../entities/kitchen";

export const useKitchen = () => {
  const client = useQueryClient();
  const staff = useQuery(staffQueries.current());
  const allowed = !staff.isError && !!staff.data && staff.data.role !== "None";
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);
  const orders = useQuery({ ...kitchenQueries.list(businessDate), enabled: allowed });
  const [connected, setConnected] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const update = useMutation({
    mutationFn: updateCookingState,
    retry: false,
    onSettled: async () => {
      await client.cancelQueries({ queryKey: kitchenQueryScopes.all() });
      await client.invalidateQueries({ queryKey: kitchenQueryScopes.all() });
    },
  });

  useEffect(() => {
    if (!allowed) {
      return undefined;
    }
    return subscribeKitchenOrders({
      onConnected: () => setConnected(true),
      onRefresh: () => {
        const current = currentBusinessDate();
        if (current === businessDate) {
          void client.invalidateQueries({ queryKey: kitchenQueryScopes.all() });
        } else {
          setBusinessDate(current);
        }
      },
      onDisconnected: () => {
        setConnected(false);
        void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
      },
      onDenied: () => {
        setConnected(false);
        client.removeQueries({ queryKey: kitchenQueryScopes.all() });
        void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
      },
    });
    // eslint-disable-next-line react/exhaustive-effect-dependencies -- 手動再読み込み時は閉じたSSE接続も作り直す。
  }, [allowed, businessDate, client, connectionAttempt]);

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
    failed: orders.isError,
    connected: allowed && connected,
    pending: update.isPending || orders.isFetching,
    error: update.error?.message ?? null,
    message: update.isSuccess
      ? `注文${update.variables.order.orderNumber}の${update.variables.line.name}を${cookingStateLabels[update.variables.to]}に更新しました。`
      : null,
    actions: {
      onRetry: () => {
        setConnected(false);
        setBusinessDate(currentBusinessDate());
        setConnectionAttempt((attempt) => attempt + 1);
        void staff.refetch();
        if (allowed) {
          void orders.refetch();
        }
      },
      onUpdate: (order: KitchenOrder, line: KitchenOrderLine, to: CookingState) => {
        if (allowed && connected && !orders.isError && !orders.isPending && !orders.isFetching && !update.isPending) {
          update.mutate({ order, line, to });
        }
      },
    },
  };
};
