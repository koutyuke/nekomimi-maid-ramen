import { useOrderManagement } from "../../model/use-order-management";
import { OrderManagementPageUI } from "./order-management-page.ui";

export const OrderManagementPage = () => <OrderManagementPageUI {...useOrderManagement()} />;
