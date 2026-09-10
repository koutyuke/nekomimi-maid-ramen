import { api } from "../../../shared/api";
import type { MenuItem } from "../model/menu";

export const getMenu = async (): Promise<readonly MenuItem[]> => {
  const { data, error } = await api.menu.get();

  if (error) {
    // 応答の内容は来場者へ見せない。画面は取得できなかったことだけを伝える。
    throw new Error(`メニューの取得に失敗した (status: ${error.status})`);
  }

  return data.items;
};
