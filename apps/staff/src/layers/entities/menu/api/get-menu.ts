import { api, ReadError } from "../../../shared/api";
import type { Snapshot } from "../../../shared/api";
import type { MenuItem } from "../model/menu";

export const getMenu = async (signal: AbortSignal): Promise<Snapshot<readonly MenuItem[]>> => {
  const { data, error } = await api.staff.menu.get({
    fetch: { signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]) },
  });

  if (error) {
    throw new ReadError(error.status, "商品情報を取得できませんでした。");
  }

  return { data: data.items, revision: data.revision };
};
