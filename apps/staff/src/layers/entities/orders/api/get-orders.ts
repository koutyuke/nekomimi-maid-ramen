import { api, ReadError } from "../../../shared/api";
import type { Snapshot } from "../../../shared/api";
import type { OrderSummary } from "../model/order";

export const getOrders = async (
  businessDate: string,
  signal: AbortSignal,
): Promise<Snapshot<readonly OrderSummary[]>> => {
  const { data, error } = await api.staff.orders.get({
    query: {
      businessDate,
      includeCancelled: true,
    },
    fetch: {
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
    },
  });
  if (error) {
    throw new ReadError(error.status, "注文を取得できませんでした。権限と通信状況を確認してください。");
  }
  return {
    data: data.orders,
    revision: data.revision,
  };
};
