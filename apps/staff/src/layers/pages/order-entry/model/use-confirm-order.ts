import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { menuQueryScopes } from "../../../entities/menu";
import { confirmOrder } from "../api/confirm-order";
import { calculateCheckout } from "../lib/checkout";
import type { Confirmation, OrderRequest } from "../api/confirm-order";
import type { DraftLine, Receipt } from "../lib/checkout";

type ConfirmationAttempt = {
  request: OrderRequest;
  receipt: Omit<Receipt, "order">;
};

type ConfirmationState =
  | { status: "idle" }
  | { status: "pending"; attempt: ConfirmationAttempt }
  | { status: "uncertain"; attempt: ConfirmationAttempt; rejection: Extract<Confirmation, { kind: "rejected" }> | null }
  | { status: "failed"; result: Exclude<Confirmation, { kind: "confirmed" }> }
  | { status: "confirmed"; result: Extract<Confirmation, { kind: "confirmed" }> };

export const useConfirmOrder = () => {
  const [state, setState] = useState<ConfirmationState>({ status: "idle" });
  const [previousOrder, setPreviousOrder] = useState<Receipt | null>(null);
  const sending = useRef(false);

  const client = useQueryClient();
  const awaitingResult = state.status === "pending" || state.status === "uncertain";
  const locked = awaitingResult || state.status === "confirmed";
  const isLocked = () => locked || sending.current;

  // 送信後にページを閉じると再送用の識別子を失うため、結果の確認まで離脱を警告する。
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    if (awaitingResult) {
      window.addEventListener("beforeunload", warn);
    }

    return () => window.removeEventListener("beforeunload", warn);
  }, [awaitingResult]);

  const send = async (attempt: ConfirmationAttempt, retrying: boolean) => {
    if (sending.current) {
      return;
    }
    sending.current = true;
    setState({ status: "pending", attempt });

    try {
      const response = await confirmOrder(attempt.request);

      if (response.kind === "confirmed") {
        setPreviousOrder({
          ...attempt.receipt,
          order: response.order,
        });
        setState({ status: "confirmed", result: response });
      } else if (retrying && response.kind === "rejected") {
        // 再送の拒否では最初の送信が未確定とは判断できないため、要求を保持する。
        setState({ status: "uncertain", attempt, rejection: response });
      } else {
        setState({ status: "failed", result: response });
      }

      void client.invalidateQueries({
        queryKey: menuQueryScopes.all(),
      });
    } catch {
      setState({ status: "uncertain", attempt, rejection: null });
    } finally {
      sending.current = false;
    }
  };

  const submit = async (lines: readonly DraftLine[], received: number | null) => {
    if (isLocked() || received === null) {
      return;
    }
    await send(
      {
        request: {
          requestId: crypto.randomUUID(),
          lines: lines.map((line) => ({ menuItemId: line.item.id, quantity: Number(line.quantity) })),
        },
        receipt: {
          names: Object.fromEntries(lines.map((line) => [line.item.id, line.item.name])),
          received,
          quotedTotal: calculateCheckout(lines, String(received)).total,
        },
      },
      false,
    );
  };

  const retry = async () => {
    if (state.status === "uncertain") {
      await send(state.attempt, true);
    }
  };

  const reset = () => {
    if (!sending.current && !awaitingResult) {
      setState({ status: "idle" });
    }
  };

  return {
    state,
    previousOrder,
    locked,
    isLocked,
    submit,
    retry,
    reset,
  };
};
