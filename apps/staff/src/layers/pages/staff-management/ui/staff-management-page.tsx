import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries, staffQueryScopes, STAFF_ROLE_PRIORITY } from "../../../entities/staff";
import { updateRole } from "../api/update-role";
import { StaffManagementPageUI } from "./staff-management-page.ui";

export const StaffManagementPage = () => {
  const queryClient = useQueryClient();
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  const canManage = staff?.role === "Owner" || staff?.role === "Admin";
  const members = useQuery({ ...staffQueries.list(), enabled: canManage });
  const update = useMutation({
    mutationFn: updateRole,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
    },
  });

  if (!staff || (staff.role !== "Owner" && staff.role !== "Admin")) {
    return null;
  }

  return (
    <StaffManagementPageUI
      currentStaff={{ id: staff.id, role: staff.role }}
      members={(members.data ?? []).toSorted((a, b) => STAFF_ROLE_PRIORITY[a.role] - STAFF_ROLE_PRIORITY[b.role])}
      loading={members.isPending}
      failed={members.isError}
      busy={update.isPending}
      updateFailed={update.isError}
      updateResult={update.data ?? null}
      onRetry={() => {
        void queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
      }}
      onUpdateRole={(id, role) => update.mutate({ id, role })}
    />
  );
};
