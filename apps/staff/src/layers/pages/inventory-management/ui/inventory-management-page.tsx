import { useInventoryManagement } from "../model/use-inventory-management";
import { InventoryManagementPageUI } from "./inventory-management-page.ui";

export const InventoryManagementPage = () => {
  const { inventory, stockUpdate, realtimeConnected, retry, update } = useInventoryManagement();

  return (
    <InventoryManagementPageUI
      inventory={inventory}
      stockUpdate={stockUpdate}
      realtimeConnected={realtimeConnected}
      onRetry={retry}
      onUpdate={update}
    />
  );
};
