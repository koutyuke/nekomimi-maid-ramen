import type { MenuItem } from "../../../entities/menu";
import type { Confirmation } from "../api/confirm-order";

export type DraftLine = { item: MenuItem; quantity: string };

export const calculateCheckout = (lines: readonly DraftLine[], received: string) => {
  const validLines =
    lines.length > 0 &&
    lines.every(({ quantity }) => /^\d+$/.test(quantity) && Number(quantity) >= 1 && Number(quantity) <= 10);
  const total = validLines ? lines.reduce((sum, line) => sum + line.item.price * Number(line.quantity), 0) : null;
  const cash = /^\d+$/.test(received) && Number.isSafeInteger(Number(received)) ? Number(received) : null;
  const change = total !== null && cash !== null && cash >= total ? cash - total : null;
  return { total, change };
};

export type Receipt = {
  order: Extract<Confirmation, { kind: "confirmed" }>["order"];
  names: Record<string, string>;
  received: number;
  quotedTotal: number | null;
};

export const stockShortages = (lines: readonly DraftLine[], items: readonly MenuItem[]) =>
  lines.flatMap((line) => {
    const item = items.find((candidate) => candidate.id === line.item.id);
    const available = item?.sellable ? item.quantity : 0;
    const requested = Number(line.quantity);
    return requested > available ? [{ name: line.item.name, menuItemId: line.item.id, requested, available }] : [];
  });
