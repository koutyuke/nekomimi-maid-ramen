import { useOrderManagement } from "../model/use-order-management";
import { OrderManagementPageUI } from "./order-management-page.ui";

export const OrderManagementPage = () => {
  const { businessDate, changeBusinessDate, orders, realtimeConnected, cancellation, retry } = useOrderManagement();

  return (
    <OrderManagementPageUI
      businessDate={businessDate}
      orders={orders}
      realtimeConnected={realtimeConnected}
      cancellationPending={cancellation.pending}
      cancellationError={cancellation.error}
      cancelledOrderNumber={cancellation.cancelledOrderNumber}
      onBusinessDateChange={changeBusinessDate}
      onCancel={cancellation.cancel}
      onRetry={retry}
    />
  );
};
