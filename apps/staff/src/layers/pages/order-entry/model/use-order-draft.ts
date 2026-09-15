import { useState } from "react";

import { calculateCheckout, changeLineQuantity, stockShortages } from "../lib/checkout";
import type { MenuItem } from "../../../entities/menu";
import type { DraftLine } from "../lib/checkout";

export const useOrderDraft = (items: readonly MenuItem[], freezeMenuUpdates: boolean) => {
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [received, setReceived] = useState<number | null>(null);

  const currentLines = freezeMenuUpdates
    ? lines
    : lines.map((line) => ({
        quantity: line.quantity,
        item: items.find((item) => item.id === line.item.id) ?? line.item,
      }));

  const changeQuantity = (item: MenuItem, delta: -1 | 1) => {
    setLines((current) => changeLineQuantity(current, item, delta));
  };

  const changeReceived = (value: number | null) => {
    if (value === null || (Number.isSafeInteger(value) && value >= 0 && value % 100 === 0)) {
      setReceived(value);
    }
  };

  const capture = () => {
    setLines(currentLines);
    return { lines: currentLines, received };
  };

  const reset = () => {
    setLines([]);
    setReceived(null);
  };

  const checkout = calculateCheckout(currentLines, received === null ? "" : String(received));
  const shortages = stockShortages(currentLines, items);

  return {
    values: { lines: currentLines, received },
    checkout,
    shortages,
    isValid: checkout.change !== null && shortages.length === 0,
    changeQuantity,
    changeReceived,
    capture,
    reset,
  };
};
