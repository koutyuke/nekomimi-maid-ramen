import { api } from "../../../shared/api";
import type { HandoffOrder } from "../../../entities/handoff";

export const completeHandoff = async (order: HandoffOrder) => {
  const { data, error } = await api.staff.orders({ id: order.id }).handoff.post();
  if (error) {
    if (error.status === 409) {
      throw new Error("注文の状態または権限が変わりました。最新の内容を確認してください。");
    }
    throw new Error("記録結果を確認できません。再照合し、受け渡し済みか確認してください。");
  }
  return data;
};
