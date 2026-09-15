import { api } from "../../../shared/api";

export const updateStock = async ({ menuItemId, quantity }: { menuItemId: string; quantity: number }) => {
  const { data, error } = await api.staff.menu({ menuItemId }).stock.put({ quantity });
  if (error) {
    throw new Error("在庫を更新できませんでした。権限と通信状況を確認し、もう一度お試しください。");
  }
  return data;
};
