import { api, ReadError } from "../../../shared/api";
import type { OrderSummary } from "../../../entities/orders";

export const cancelOrder = async (order: OrderSummary) => {
  const unknownResult =
    "取消結果を確認できません。再読み込みして注文の取消状況を確認してください。重ねて返金しないでください。";
  const { data, error } = await api.staff
    .orders({ id: order.id })
    .cancel.post(undefined, {
      fetch: { signal: AbortSignal.timeout(5_000) },
    })
    .catch(() => {
      throw new Error(unknownResult);
    });
  if (error) {
    throw new ReadError(
      error.status,
      error.status === 409
        ? "注文の状態または権限が変わりました。最新の一覧と取消状況を確認してください。"
        : error.status === 401 || error.status === 403
          ? "注文を取り消す権限がありません。管理者に確認してください。"
          : unknownResult,
    );
  }
  return data;
};
