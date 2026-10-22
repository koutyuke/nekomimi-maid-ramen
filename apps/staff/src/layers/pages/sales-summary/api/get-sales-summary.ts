import { api, ReadError } from "../../../shared/api";

export const getSalesSummary = async (businessDate: string, signal: AbortSignal) => {
  const { data, error } = await api.staff["sales-summary"].get({
    query: { businessDate },
    fetch: { signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]) },
  });

  if (error) {
    throw new ReadError(error.status, "売上を取得できませんでした。権限と通信状況を確認してください。");
  }
  const { revision, ...summary } = data;
  return { data: summary, revision };
};
