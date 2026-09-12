import { useKitchen } from "../../model/use-kitchen";
import { KitchenPageUI } from "./kitchen-page.ui";

export const KitchenPage = () => {
  const {
    access,
    orders,
    loading,
    failed,
    connected,
    pendingLines,
    error,
    actions: { onRetry, onUpdate },
  } = useKitchen();

  return (
    <KitchenPageUI
      access={access}
      orders={orders}
      loading={loading}
      failed={failed}
      pendingLines={pendingLines}
      connected={connected}
      error={error}
      actions={{ onRetry, onUpdate }}
    />
  );
};
