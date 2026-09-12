import { api } from "../../../shared/api";
import type { CookingState, KitchenOrder, KitchenOrderLine } from "../model/kitchen-order";

export const updateCookingState = async ({
  order,
  line,
  to,
}: {
  order: KitchenOrder;
  line: KitchenOrderLine;
  to: CookingState;
}) => {
  const endpoint = api.orders({ id: order.id }).lines({ menuItemId: line.menuItemId });
  const { data, error } = await endpoint["cooking-state"].patch({ to });
  if (error) {
    if (error.status === 409) {
      throw new Error("商品の状態または権限が変わりました。一覧を確認してから操作してください。");
    }
    throw new Error("更新結果を確認できません。権限と通信状況を確認し、一覧を読み直してください。");
  }
  return data;
};
