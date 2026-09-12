import { api, ReadError } from "../../../shared/api";

export const getHandoffRevision = async (signal: AbortSignal) => {
  const { data, error } = await api.staff.orders.revision.get({
    fetch: {
      signal,
    },
  });

  if (error) {
    throw new ReadError(error.status, "更新を確認できませんでした。");
  }
  return data.revision;
};
