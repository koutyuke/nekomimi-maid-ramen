import { api } from "../../../shared/api";

export const updatePrice = async ({ menuItemId, price }: { menuItemId: string; price: number }) => {
  const { data, error } = await api.staff.menu({ menuItemId }).price.put({ price });
  if (error) {
    throw new Error("価格を更新できませんでした。権限と通信状況を確認し、もう一度お試しください。");
  }
  return data;
};
