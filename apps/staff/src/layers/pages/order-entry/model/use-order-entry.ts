import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { menuQueries } from "../../../entities/menu";
import { staffQueries } from "../../../entities/staff";
import { calculateCheckout } from "./checkout";
import { useConfirmOrder } from "./use-confirm-order";
import type { MenuItem } from "../../../entities/menu";
import type { DraftLine } from "./checkout";

export const useOrderEntry = () => {
  const staff = useQuery(staffQueries.current());
  const allowed = !staff.isError && !!staff.data && staff.data.role !== "None";
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [received, setReceived] = useState("");
  const confirmation = useConfirmOrder();
  const { pending, uncertain, result, previousOrder, locked } = confirmation;
  const menu = useQuery({ ...menuQueries.list(), enabled: allowed });
  const currentLines = locked
    ? lines
    : lines.map((line) => ({ ...line, item: menu.data?.find((item) => item.id === line.item.id) ?? line.item }));

  const submit = () => {
    if (!allowed || pending || result?.kind === "confirmed") {
      return;
    }
    if (
      !uncertain &&
      (menu.isError ||
        menu.isPending ||
        calculateCheckout(currentLines, received).change === null ||
        lines.some((line) => !menu.data.some((item) => item.id === line.item.id && item.sellable)))
    ) {
      return;
    }
    setLines(currentLines);
    void confirmation.submit(currentLines, received);
  };

  return {
    access: staff.isPending
      ? ("loading" as const)
      : staff.isError
        ? ("error" as const)
        : allowed
          ? ("allowed" as const)
          : ("denied" as const),
    items: menu.data ?? [],
    menuLoading: menu.isPending,
    menuFailed: menu.isError,
    lines: currentLines,
    received,
    pending,
    uncertain,
    result,
    previousOrder,
    actions: {
      onRetry: () => {
        void staff.refetch();
        void menu.refetch();
      },
      onStep: (item: MenuItem, delta: -1 | 1) => {
        if (confirmation.isLocked()) {
          return;
        }
        confirmation.clearResult();
        setLines((current) => {
          const quantity = Number(current.find((line) => line.item.id === item.id)?.quantity ?? 0) + delta;
          if (
            !Number.isInteger(quantity) ||
            quantity < 0 ||
            quantity > 10 ||
            (delta > 0 && (!item.sellable || menu.isError))
          ) {
            return current;
          }
          if (quantity === 0) {
            return current.filter((line) => line.item.id !== item.id);
          }
          return current.some((line) => line.item.id === item.id)
            ? current.map((line) => (line.item.id === item.id ? { ...line, quantity: String(quantity) } : line))
            : [...current, { item, quantity: String(quantity) }];
        });
      },
      onReceived: (value: string) => {
        if (
          !confirmation.isLocked() &&
          (value === "" || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) % 100 === 0))
        ) {
          setReceived(value);
        }
      },
      onSubmit: submit,
      onNext: () => {
        if (result?.kind === "confirmed") {
          setLines([]);
          setReceived("");
          confirmation.clearResult();
        }
      },
    },
  };
};
