import { api } from "../../../shared/api";
import type { MenuItem } from "@nekomimi/core/models";

export const getMenu = async (): Promise<readonly MenuItem[]> => {
  const { data, error } = await api.menu.get();
  if (error) {
    throw new Error("メニュー取得失敗");
  }
  return data.items;
};
