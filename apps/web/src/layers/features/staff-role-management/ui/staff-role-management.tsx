import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { staffQueries, staffQueryScopes, STAFF_ROLE_PRIORITY } from "../../../entities/staff";
import { updateRole } from "../api/update-role";
import { StaffRoleManagementUI } from "./staff-role-management.ui";
import type { StaffRoleManagementUIProps } from "./staff-role-management.ui";

type Props = Pick<StaffRoleManagementUIProps, "currentStaff">;

export const StaffRoleManagement = ({ currentStaff }: Props) => {
  const queryClient = useQueryClient();
  const members = useQuery(staffQueries.list());
  const update = useMutation({
    mutationFn: updateRole,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
    },
  });
  return (
    <StaffRoleManagementUI
      currentStaff={currentStaff}
      members={(members.data ?? []).toSorted((a, b) => STAFF_ROLE_PRIORITY[a.role] - STAFF_ROLE_PRIORITY[b.role])}
      loading={members.isPending}
      failed={members.isError}
      busy={update.isPending}
      updateFailed={update.isError}
      updateResult={update.data ?? null}
      actions={{
        onRetry: () => {
          void queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
        },
        onUpdateRole: (id, role) => update.mutate({ id, role }),
      }}
    />
  );
};
