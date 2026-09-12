import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { menuQueryScopes } from "../../../entities/menu";
import { confirmOrder } from "../api/confirm-order";
import { calculateCheckout } from "./checkout";
import type { Confirmation, OrderRequest } from "../api/confirm-order";
import type { DraftLine, Receipt } from "./checkout";

type ConfirmationAttempt = {
  request: OrderRequest;
  receipt: Omit<Receipt, "order">;
};

export const useConfirmOrder = () => {
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [result, setResult] = useState<Confirmation | null>(null);
  const [previousOrder, setPreviousOrder] = useState<Receipt | null>(null);

  const attempt = useRef<ConfirmationAttempt | null>(null);
  const sending = useRef(false);

  const client = useQueryClient();
  const locked = pending || uncertain || result?.kind === "confirmed";

  // 送信後にページを閉じると再送用の識別子を失うため、結果の確認まで離脱を警告する。
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    if (pending || uncertain) {
      window.addEventListener("beforeunload", warn);
    }

    return () => window.removeEventListener("beforeunload", warn);
  }, [pending, uncertain]);

  const submit = async (lines: readonly DraftLine[], received: string) => {
    if (sending.current || result?.kind === "confirmed") {
      return;
    }
    // 再送では呼び出し元の入力を使わず、最初の要求と精算情報を一緒に再利用する。
    const currentAttempt = attempt.current ?? {
      request: {
        requestId: crypto.randomUUID(),
        lines: lines.map((line) => ({
          menuItemId: line.item.id,
          quantity: Number(line.quantity),
        })),
      },

      receipt: {
        names: Object.fromEntries(lines.map((line) => [line.item.id, line.item.name])),
        received: Number(received),
        quotedTotal: calculateCheckout(lines, received).total,
      },
    };

    attempt.current = currentAttempt;
    sending.current = true;
    setPending(true);
    setUncertain(false);

    try {
      const response = await confirmOrder(currentAttempt.request);
      setResult(response);

      if (response.kind === "confirmed") {
        setPreviousOrder({
          ...currentAttempt.receipt,
          order: response.order,
        });
      }

      // 結果不明の再送が権限などで拒否されても、最初の送信が未確定とは限らない。
      if (uncertain && response.kind === "rejected") {
        setUncertain(true);
      } else {
        attempt.current = null;
      }

      void client.invalidateQueries({
        queryKey: menuQueryScopes.all(),
      });
    } catch {
      setUncertain(true);
    } finally {
      sending.current = false;
      setPending(false);
    }
  };

  return {
    pending,
    uncertain,
    result,
    previousOrder,
    locked,
    isLocked: () => locked || sending.current,
    submit,
    clearResult: () => {
      if (!sending.current && !uncertain) {
        setResult(null);
      }
    },
  };
};
