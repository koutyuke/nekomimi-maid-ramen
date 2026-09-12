import { api } from "../../../shared/api";

export const getKitchenOrders = async (businessDate: string) => {
  const { data, error } = await api.orders.get({ query: { businessDate } });
  if (error) {
    throw new Error("調理注文を取得できませんでした。権限と通信状況を確認してください。");
  }
  return data.orders;
};
