import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { handoffQueries, handoffQueryScopes } from "../../../entities/handoff";
import {
  cookingStateLabels,
  kitchenQueryScopes,
  subscribeKitchenOrders,
  updateCookingState,
} from "../../../entities/kitchen";
import { staffQueries } from "../../../entities/staff";
import { currentBusinessDate } from "../../../shared/business-date";
import { completeHandoff } from "../api/complete-handoff";
import type { HandoffOrder, HandoffOrderLine } from "../../../entities/handoff";
import type { CookingState } from "../../../entities/kitchen";

export const useHandoff = () => {
  const client = useQueryClient();
  const staff = useQuery(staffQueries.current());
  const allowed = !staff.isError && !!staff.data && staff.data.role !== "None";
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);
  const [connected, setConnected] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const orders = useQuery({ ...handoffQueries.list(businessDate), enabled: allowed });
  const refreshOrders = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: handoffQueryScopes.all() }),
      client.invalidateQueries({ queryKey: kitchenQueryScopes.all() }),
    ]);
  };
  const update = useMutation({ mutationFn: updateCookingState, retry: false, onSettled: refreshOrders });
  const complete = useMutation({ mutationFn: completeHandoff, retry: false, onSettled: refreshOrders });

  useEffect(() => {
    if (!allowed) {
      return undefined;
    }
    return subscribeKitchenOrders({
      onConnected: () => setConnected(true),
      onRefresh: () => {
        const current = currentBusinessDate();
        if (current === businessDate) {
          void client.invalidateQueries({ queryKey: handoffQueryScopes.all() });
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
        client.removeQueries({ queryKey: handoffQueryScopes.all() });
        void client.invalidateQueries({ queryKey: staffQueries.current().queryKey });
      },
    });
    // eslint-disable-next-line react/exhaustive-effect-dependencies -- 手動再読み込み時は閉じたSSE接続も作り直す。
  }, [allowed, businessDate, client, connectionAttempt]);

  const ready =
    connected && !orders.isError && !orders.isPending && !orders.isFetching && !update.isPending && !complete.isPending;

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
    pending: update.isPending || complete.isPending || orders.isFetching,
    error: update.error?.message ?? complete.error?.message ?? null,
    message: update.isSuccess
      ? `注文${update.variables.order.orderNumber}の${update.variables.line.name}を${cookingStateLabels[update.variables.to]}に更新しました。`
      : complete.isSuccess
        ? `注文${complete.variables.orderNumber}を受け渡し済みにしました。`
        : null,
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
          current.lines.length > 0 &&
          current.cookingState === "completed" &&
          !current.cancelledAt &&
          !current.handedOffAt
        ) {
          complete.mutate(current);
        }
      },
      onRetry: () => {
        setConnected(false);
        setBusinessDate(currentBusinessDate());
        setConnectionAttempt((attempt) => attempt + 1);
        void staff.refetch();
        if (allowed) {
          void orders.refetch();
        }
      },
    },
  };
};
