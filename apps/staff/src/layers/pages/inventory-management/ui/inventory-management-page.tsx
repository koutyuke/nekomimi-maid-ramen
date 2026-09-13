import { StockManagement } from "../../../features/stock-management";
import { AdminGuard } from "../../../widgets/admin-guard";
import { InventoryManagementPageUI } from "./inventory-management-page.ui";

export const InventoryManagementPage = () => (
  <AdminGuard>
    <InventoryManagementPageUI slots={{ stockManagement: <StockManagement /> }} />
  </AdminGuard>
);
