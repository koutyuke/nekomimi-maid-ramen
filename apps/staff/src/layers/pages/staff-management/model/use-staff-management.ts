import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { staffQueries, staffQueryScopes, STAFF_ROLE_PRIORITY } from "../../../entities/staff";
import { updateRole } from "../api/update-role";
import type { Staff, StaffRole } from "../../../entities/staff";

export type StaffListState =
  | { status: "pending" }
  | { status: "error" }
  | { status: "success"; data: readonly Staff[] };

// 成功は画面右下の通知で知らせるため、状態として持たない。
export type RoleUpdateState = { status: "idle" } | { status: "pending" } | { status: "error" };

export const useStaffManagement = () => {
  const queryClient = useQueryClient();
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  const canManage = staff?.role === "Owner" || staff?.role === "Admin";
  const members = useQuery({ ...staffQueries.list(), enabled: canManage });
  const mutation = useMutation({
    mutationFn: updateRole,
    onSuccess: ({ name, role }) => {
      notifications.show({
        color: "green",
        title: "ロールを変更しました",
        message: `${name}のロールを${role}に変更しました。`,
      });
    },
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
    .with({ status: "idle" }, { status: "success" }, () => ({ status: "idle" }))
    .with({ status: "pending" }, () => ({ status: "pending" }))
    .with({ status: "error" }, () => ({ status: "error" }))
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
