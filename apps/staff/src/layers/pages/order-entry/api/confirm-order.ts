import { api } from "../../../shared/api";

export type OrderRequest = { requestId: string; lines: { menuItemId: string; quantity: number }[] };

export const confirmOrder = async (request: OrderRequest) => {
  const { data, error } = await api.staff.orders.post(request);

  if (!error) {
    return { kind: "confirmed", order: data } as const;
  }

  if (error.status === 409 && error.value.code === "out_of_stock") {
    return { kind: "shortage", shortages: error.value.shortages } as const;
  }

  if (error.status === 401 || error.status === 403) {
    return { kind: "rejected", message: "ログイン状態とスタッフ権限を確認してください。" } as const;
  }

  if (error.status === 422) {
    return {
      kind: "rejected",
      message: "販売していない商品、または入力に問題があります。商品情報を更新して注文候補を確認してください。",
    } as const;
  }

  throw new Error("注文の確定結果を確認できません。");
};

export type Confirmation = Awaited<ReturnType<typeof confirmOrder>>;
