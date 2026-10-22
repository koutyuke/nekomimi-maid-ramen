import { useProductManagement } from "../model/use-product-management";
import { ProductManagementPageUI } from "./product-management-page.ui";

export const ProductManagementPage = () => {
  const { products, itemUpdate, realtimeConnected, retry, update } = useProductManagement();

  return (
    <ProductManagementPageUI
      products={products}
      itemUpdate={itemUpdate}
      realtimeConnected={realtimeConnected}
      onRetry={retry}
      onUpdate={update}
    />
  );
};
