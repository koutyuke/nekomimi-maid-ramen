import { api, ReadError } from "../../../shared/api";
import type { MenuItem } from "../model/menu";
import type { Snapshot } from "@nekomimi/api";

export const getMenu = async (signal: AbortSignal): Promise<Snapshot<readonly MenuItem[]>> => {
  const { data, error } = await api.staff.menu.get({
    fetch: { signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]) },
  });

  if (error) {
    throw new ReadError(error.status, "商品情報を取得できませんでした。");
  }

  return { data: data.items, revision: data.revision };
};

export const getMenuRevision = async (signal: AbortSignal) => {
  const { data, error } = await api.staff.menu.revision.get({ fetch: { signal } });
  if (error) {
    throw new ReadError(error.status, "更新を確認できませんでした。");
  }
  return data.revision;
};
