import { useSalesSummary } from "../model/use-sales-summary";
import { SalesSummaryPageUI } from "./sales-summary-page.ui";

export const SalesSummaryPage = () => {
  const { businessDate, changeBusinessDate, summary, realtimeConnected, retry } = useSalesSummary();

  return (
    <SalesSummaryPageUI
      businessDate={businessDate}
      summary={summary}
      realtimeConnected={realtimeConnected}
      onBusinessDateChange={changeBusinessDate}
      onRetry={retry}
    />
  );
};
