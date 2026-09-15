import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { getMenuRevision, menuQueries } from "../../../entities/menu";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import type { MenuItem } from "../../../entities/menu";

export type MenuState =
  | { status: "pending"; data: undefined }
  | { status: "denied"; data: undefined }
  | { status: "error"; data: readonly MenuItem[] | undefined }
  | { status: "success"; data: readonly MenuItem[] };

type OrderEntryState = {
  menu: MenuState;
  realtimeConnected: boolean;
  retry: () => void;
};

export const useOrderEntry = (): OrderEntryState => {
  const options = menuQueries.list();

  const realtime = useRealtime({
    scope: "menu",
    checkRevision: getMenuRevision,
    queryKey: options.queryKey,
  });

  const menu = useQuery({
    ...options,
    enabled: !realtime.denied,
  });

  const retry = () => {
    realtime.retry();
    void menu.refetch();
  };

  const menuState = match(menu)
    .returnType<MenuState>()
    .when(
      () => realtime.denied || isAccessDenied(menu.error),
      () => ({ status: "denied", data: undefined }),
    )
    .when(
      () => realtime.failed,
      () => ({ status: "error", data: menu.data }),
    )
    .with({ status: "error" }, ({ data }) => ({ status: "error", data }))
    .with({ status: "pending" }, () => ({ status: "pending", data: undefined }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", data }))
    .exhaustive();

  return {
    menu: menuState,
    realtimeConnected: realtime.connected,
    retry,
  };
};
