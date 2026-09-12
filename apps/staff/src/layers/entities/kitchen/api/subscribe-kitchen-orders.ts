import { getAPIBaseURL } from "@nekomimi/core/http";

export const subscribeKitchenOrders = (actions: {
  onRefresh: () => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onDenied: () => void;
}) => {
  const source = new EventSource(new URL("/orders/events", getAPIBaseURL(import.meta.env.PROD)), {
    withCredentials: true,
  });
  source.addEventListener("refresh", () => {
    actions.onConnected();
    actions.onRefresh();
  });
  source.addEventListener("heartbeat", actions.onConnected);
  source.addEventListener("error", actions.onDisconnected);
  source.addEventListener("access-denied", () => {
    source.close();
    actions.onDenied();
  });
  return () => source.close();
};
