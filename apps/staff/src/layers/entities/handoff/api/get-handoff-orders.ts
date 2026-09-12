import { api } from "../../../shared/api";

export const getHandoffOrders = async (businessDate: string) => {
  const { data, error } = await api.orders.get({ query: { businessDate } });
  if (error) {
    throw new Error("受け渡し注文を取得できませんでした。権限と通信状況を確認してください。");
  }
  return data.orders;
};
