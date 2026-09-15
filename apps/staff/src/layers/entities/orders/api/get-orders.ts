import { api, ReadError } from "../../../shared/api";

export const getOrders = async (
  query: { businessDate: string; includeCancelled?: true },
  signal: AbortSignal,
  errorMessage: string,
) => {
  const { data, error } = await api.staff.orders.get({
    query,
    fetch: {
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
    },
  });

  if (error) {
    throw new ReadError(error.status, errorMessage);
  }
  return {
    data: data.orders,
    revision: data.revision,
  };
};
