import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { staffQueries, staffQueryScopes, STAFF_ROLE_PRIORITY } from "../../../entities/staff";
import { updateRole } from "../api/update-role";
import type { Staff, StaffRole } from "../../../entities/staff";

export type StaffListState =
  | { status: "pending" }
  | { status: "error" }
  | { status: "success"; data: readonly Staff[] };

export type RoleUpdateState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error" }
  | { status: "success"; result: Pick<Staff, "name" | "role"> };

export const useStaffManagement = () => {
  const queryClient = useQueryClient();
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  const canManage = staff?.role === "Owner" || staff?.role === "Admin";
  const members = useQuery({ ...staffQueries.list(), enabled: canManage });
  const mutation = useMutation({
    mutationFn: updateRole,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
    },
  });

  const membersState = match(members)
    .returnType<StaffListState>()
    .with({ status: "pending" }, () => ({ status: "pending" }))
    .with({ status: "error" }, () => ({ status: "error" }))
    .with({ status: "success" }, ({ data }) => ({
      status: "success",
      data: data.toSorted((a, b) => STAFF_ROLE_PRIORITY[a.role] - STAFF_ROLE_PRIORITY[b.role]),
    }))
    .exhaustive();

  const roleUpdate = match(mutation)
    .returnType<RoleUpdateState>()
    .with({ status: "idle" }, () => ({ status: "idle" }))
    .with({ status: "pending" }, () => ({ status: "pending" }))
    .with({ status: "error" }, () => ({ status: "error" }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", result: data }))
    .exhaustive();

  if (!staff || (staff.role !== "Owner" && staff.role !== "Admin")) {
    return null;
  }

  const retry = () => {
    void queryClient.invalidateQueries({ queryKey: staffQueryScopes.all() });
  };

  const update = (id: string, role: Exclude<StaffRole, "Owner">) => mutation.mutate({ id, role });

  return { currentStaff: { id: staff.id, role: staff.role }, members: membersState, roleUpdate, retry, update };
};
