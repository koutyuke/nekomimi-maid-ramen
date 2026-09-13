import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMenuRevision, menuQueries, menuQueryScopes } from "../../../entities/menu";
import { useRealtime } from "../../../features/sync-data";
import { updateStock } from "../api/update-stock";
import { StockManagementUI } from "./stock-management.ui";

export const StockManagement = () => {
  const queryClient = useQueryClient();
  const menuOptions = menuQueries.list();
  const realtime = useRealtime({
    scope: "menu",
    checkRevision: getMenuRevision,
    queryKey: menuOptions.queryKey,
    enabled: true,
  });
  const menu = useQuery({ ...menuOptions, enabled: !realtime.denied });
  const update = useMutation({
    mutationFn: updateStock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: menuQueryScopes.all() });
    },
  });
  const updatedItem = menu.data?.find((item) => item.id === update.variables?.menuItemId);

  return (
    <StockManagementUI
      items={menu.data ?? []}
      loading={menu.isPending}
      failed={menu.isError || realtime.failed}
      busy={update.isPending}
      updateFailed={update.isError}
      updateResult={
        update.data && updatedItem
          ? {
              name: updatedItem.name,
              previousQuantity: update.data.previousQuantity,
              quantity: update.data.quantity,
            }
          : null
      }
      updatingMenuItemId={update.variables?.menuItemId ?? null}
      actions={{
        onRetry: () => {
          realtime.retry();
          void menu.refetch();
        },
        onUpdate: (menuItemId, quantity) => update.mutate({ menuItemId, quantity }),
      }}
    />
  );
};
