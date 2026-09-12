import { useQuery } from "@tanstack/react-query";

import { getMenuRevision } from "../../../entities/menu";
import { menuQueries } from "../../../entities/menu";
import { staffQueries } from "../../../entities/staff";
import { useRealtime } from "../../../features/sync-data";

export const useOrderEntry = () => {
  const staff = useQuery(staffQueries.current());

  const hasRole = !staff.isError && !!staff.data && staff.data.role !== "None";

  const options = menuQueries.list();

  const realtime = useRealtime({
    scope: "menu",
    checkRevision: getMenuRevision,
    queryKey: options.queryKey,
    enabled: hasRole,
  });

  const allowed = hasRole && !realtime.denied;
  const menu = useQuery({ ...options, enabled: allowed });

  const onRetry = () => {
    realtime.retry();
    void staff.refetch();
    void menu.refetch();
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
    menuFailed: menu.isError || realtime.failed,
    connected: realtime.connected,
    onRetry,
  };
};
