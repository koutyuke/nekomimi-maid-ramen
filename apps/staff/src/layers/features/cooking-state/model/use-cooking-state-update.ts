import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { updateCookingState } from "../api/update-cooking-state";

type Update = Parameters<typeof updateCookingState>[0];
export type PendingCookingLine = { orderId: string; menuItemId: string };

export const useCookingStateUpdate = (onSettled: () => Promise<unknown>) => {
  const [pendingLines, setPendingLines] = useState<PendingCookingLine[]>([]);
  const pending = useRef(pendingLines);
  const [error, setError] = useState<string | null>(null);
  const update = useMutation({
    mutationFn: updateCookingState,
    retry: false,
    onMutate: () => setError(null),
    onError: (cause) => setError(cause.message),
    onSettled: async (_data, _cause, { order, line }) => {
      try {
        await onSettled();
      } finally {
        pending.current = pending.current.filter(
          (target) => target.orderId !== order.id || target.menuItemId !== line.menuItemId,
        );
        setPendingLines(pending.current);
      }
    },
  });
  const isPending = (orderId: string, menuItemId?: string) =>
    pending.current.some(
      (target) => target.orderId === orderId && (menuItemId === undefined || target.menuItemId === menuItemId),
    );

  return {
    pendingLines,
    error,
    isPending,
    mutate: (variables: Update) => {
      const { order, line } = variables;
      if (isPending(order.id, line.menuItemId)) {
        return;
      }
      pending.current = [...pending.current, { orderId: order.id, menuItemId: line.menuItemId }];
      setPendingLines(pending.current);
      update.mutate(variables);
    },
  };
};
