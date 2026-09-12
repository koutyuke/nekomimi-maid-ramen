import { useState } from "react";

import { calculateCheckout, stockShortages } from "./checkout";
import type { MenuItem } from "../../../entities/menu";
import type { DraftLine } from "./checkout";

export const useOrderDraft = (items: readonly MenuItem[], frozen: boolean) => {
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [received, setReceived] = useState("");

  const currentLines = frozen
    ? lines
    : lines.map((line) => ({
        quantity: line.quantity,
        item: items.find((item) => item.id === line.item.id) ?? line.item,
      }));

  const step = (item: MenuItem, delta: -1 | 1) => {
    setLines((current) => {
      const line = current.find((candidate) => candidate.item.id === item.id);
      const quantity = Number(line?.quantity ?? 0) + delta;
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10 || (delta > 0 && !item.sellable)) {
        return current;
      }
      if (quantity === 0) {
        return current.filter((candidate) => candidate.item.id !== item.id);
      }
      return line
        ? current.map((candidate) =>
            candidate.item.id === item.id ? { ...candidate, quantity: String(quantity) } : candidate,
          )
        : [...current, { item, quantity: String(quantity) }];
    });
  };

  const receive = (value: string) => {
    if (value === "" || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) % 100 === 0)) {
      setReceived(value);
    }
  };

  const snapshot = () => {
    setLines(currentLines);
    return { lines: currentLines, received };
  };

  const reset = () => {
    setLines([]);
    setReceived("");
  };

  const checkout = calculateCheckout(currentLines, received);
  const shortages = stockShortages(currentLines, items);

  return {
    lines: currentLines,
    received,
    checkout,
    shortages,
    canConfirm: checkout.change !== null && shortages.length === 0,
    step,
    receive,
    snapshot,
    reset,
  };
};
