import { api, ReadError } from "../../../shared/api";

export const getMenuRevision = async (signal: AbortSignal) => {
  const { data, error } = await api.staff.menu.revision.get({ fetch: { signal } });
  if (error) {
    throw new ReadError(error.status, "更新を確認できませんでした。");
  }
  return data.revision;
};
