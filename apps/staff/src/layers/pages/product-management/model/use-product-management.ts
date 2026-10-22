import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { getMenuRevision, menuQueries, menuQueryScopes } from "../../../entities/menu";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { yen } from "../../../shared/lib";
import { updatePrice } from "../api/update-price";
import { updateStock } from "../api/update-stock";
import type { MenuItem } from "../../../entities/menu";

export type ProductsState =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "success"; data: readonly MenuItem[] };

export type ItemChange = { field: "stock"; quantity: number } | { field: "price"; price: number };

// 在庫と価格の更新は同じ一覧を書き換えるため、一度に一件だけ実行する。
// 成功は画面右下の通知で知らせるため、状態として持たない。
export type ItemUpdateState =
  | { status: "idle" }
  | { status: "pending"; menuItemId: string; field: ItemChange["field"] }
  | { status: "error"; field: ItemChange["field"] };

export const useProductManagement = () => {
  const queryClient = useQueryClient();
  const options = menuQueries.list();
  const realtime = useRealtime({
    scope: "menu",
    checkRevision: getMenuRevision,
    queryKey: options.queryKey,
  });
  const menu = useQuery({ ...options, enabled: !realtime.denied });
  const mutation = useMutation({
    mutationFn: async ({ item, change }: { item: Pick<MenuItem, "id" | "name">; change: ItemChange }) => {
      if (change.field === "price") {
        const result = await updatePrice({ menuItemId: item.id, price: change.price });
        return { title: "価格を更新しました", message: `${item.name}の価格を${yen(result.price)}に更新しました。` };
      }
      const result = await updateStock({ menuItemId: item.id, quantity: change.quantity });
      return {
        title: "在庫を更新しました",
        message: `${item.name}の在庫を${result.previousQuantity}個から${result.quantity}個へ更新しました。`,
      };
    },
    onSuccess: async ({ title, message }) => {
      notifications.show({ color: "green", title, message });
      await queryClient.invalidateQueries({ queryKey: menuQueryScopes.all() });
    },
  });

  const products = match(menu)
    .returnType<ProductsState>()
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

  const itemUpdate = match(mutation)
    .returnType<ItemUpdateState>()
    .with({ status: "idle" }, { status: "success" }, () => ({ status: "idle" }))
    .with({ status: "pending" }, ({ variables }) => ({
      status: "pending",
      menuItemId: variables.item.id,
      field: variables.change.field,
    }))
    .with({ status: "error" }, ({ variables }) => ({ status: "error", field: variables.change.field }))
    .exhaustive();

  const retry = () => {
    realtime.retry();
    void menu.refetch();
  };

  const update = (menuItemId: string, change: ItemChange) => {
    if (products.status !== "success" || mutation.isPending) {
      return;
    }
    const item = products.data.find((candidate) => candidate.id === menuItemId);
    if (item) {
      mutation.mutate({ item, change });
    }
  };

  return {
    products,
    itemUpdate,
    realtimeConnected: realtime.connected,
    retry,
    update,
  };
};
