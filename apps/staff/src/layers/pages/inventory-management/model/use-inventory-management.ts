import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { getMenuRevision, menuQueries, menuQueryScopes } from "../../../entities/menu";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { updateStock } from "../api/update-stock";
import type { MenuItem } from "../../../entities/menu";

export type InventoryState =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "success"; data: readonly MenuItem[] };

export type StockUpdateState =
  | { status: "idle" }
  | { status: "pending"; menuItemId: string }
  | { status: "error" }
  | { status: "success"; result: { name: string; previousQuantity: number; quantity: number } };

export const useInventoryManagement = () => {
  const queryClient = useQueryClient();
  const options = menuQueries.list();
  const realtime = useRealtime({
    scope: "menu",
    checkRevision: getMenuRevision,
    queryKey: options.queryKey,
  });
  const menu = useQuery({ ...options, enabled: !realtime.denied });
  const mutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: Pick<MenuItem, "id" | "name">; quantity: number }) => {
      const result = await updateStock({ menuItemId: item.id, quantity });
      return { name: item.name, previousQuantity: result.previousQuantity, quantity: result.quantity };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: menuQueryScopes.all() });
    },
  });

  const inventory = match(menu)
    .returnType<InventoryState>()
    .when(
      () => realtime.denied || isAccessDenied(menu.error),
      () => ({ status: "denied" }),
    )
    .when(
      () => realtime.failed,
      () => ({ status: "error" }),
    )
    .with({ status: "error" }, () => ({ status: "error" }))
    .with({ status: "pending" }, () => ({ status: "pending" }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", data }))
    .exhaustive();

  const stockUpdate = match(mutation)
    .returnType<StockUpdateState>()
    .with({ status: "idle" }, () => ({ status: "idle" }))
    .with({ status: "pending" }, ({ variables }) => ({ status: "pending", menuItemId: variables.item.id }))
    .with({ status: "error" }, () => ({ status: "error" }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", result: data }))
    .exhaustive();

  const retry = () => {
    realtime.retry();
    void menu.refetch();
  };

  const update = (menuItemId: string, quantity: number) => {
    if (inventory.status !== "success" || mutation.isPending) {
      return;
    }
    const item = inventory.data.find((candidate) => candidate.id === menuItemId);
    if (item) {
      mutation.mutate({ item, quantity });
    }
  };

  return { inventory, stockUpdate, retry, update };
};
