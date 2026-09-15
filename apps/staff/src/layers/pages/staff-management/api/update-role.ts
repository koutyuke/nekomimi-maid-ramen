import { api } from "../../../shared/api";
import type { Staff, StaffRole } from "../../../entities/staff";

type Props = Pick<Staff, "id"> & { role: Exclude<StaffRole, "Owner"> };

export const updateRole = async ({ id, role }: Props) => {
  const { data, error } = await api.staff({ id }).role.patch({ role });
  if (error) {
    throw new Error("ロールを変更できませんでした。権限と通信状況を確認し、もう一度お試しください。");
  }
  return data.staff;
};
