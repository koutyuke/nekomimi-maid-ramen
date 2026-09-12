import { api, ReadError } from "../../../shared/api";

export const getKitchenOrders = async (businessDate: string, signal: AbortSignal) => {
  const { data, error } = await api.staff.orders.get({
    query: { businessDate },
    fetch: { signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]) },
  });
  if (error) {
    throw new ReadError(error.status, "調理注文を取得できませんでした。権限と通信状況を確認してください。");
  }
  return { data: data.orders, revision: data.revision };
};

export const getKitchenRevision = async (signal: AbortSignal) => {
  const { data, error } = await api.staff.orders.revision.get({ fetch: { signal } });
  if (error) {
    throw new ReadError(error.status, "更新を確認できませんでした。");
  }
  return data.revision;
};
