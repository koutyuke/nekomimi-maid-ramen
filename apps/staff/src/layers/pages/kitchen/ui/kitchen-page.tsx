import { useKitchen } from "../model/use-kitchen";
import { KitchenPageUI } from "./kitchen-page.ui";

export const KitchenPage = () => {
  const { orders, realtimeConnected, cooking, retry } = useKitchen();

  return (
    <KitchenPageUI
      orders={orders}
      realtimeConnected={realtimeConnected}
      pendingLines={cooking.pendingLines}
      updateError={cooking.error}
      actions={{ onRetry: retry, onUpdate: cooking.update }}
    />
  );
};
