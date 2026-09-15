import { useHandoff } from "../model/use-handoff";
import { HandoffPageUI } from "./handoff-page.ui";

export const HandoffPage = () => {
  const { orders, realtimeConnected, cooking, handoff, retry } = useHandoff();

  return (
    <HandoffPageUI
      orders={orders}
      realtimeConnected={realtimeConnected}
      pendingLines={cooking.pendingLines}
      cookingError={cooking.error}
      handoffPending={handoff.pending}
      handoffError={handoff.error}
      onUpdate={cooking.update}
      onComplete={handoff.complete}
      onRetry={retry}
    />
  );
};
