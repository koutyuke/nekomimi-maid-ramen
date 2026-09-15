import { useConfirmOrder } from "../model/use-confirm-order";
import { useOrderDraft } from "../model/use-order-draft";
import { useOrderEntry } from "../model/use-order-entry";
import { OrderEntryPageUI } from "./order-entry-page.ui";
import type { MenuItem } from "../../../entities/menu";
import type { OrderEntryPageUIProps } from "./order-entry-page.ui";

export const OrderEntryPage = () => {
  const { menu, realtimeConnected, retry: refreshMenu } = useOrderEntry();
  const { state, previousOrder, locked, isLocked, submit, retry, reset } = useConfirmOrder();
  const draft = useOrderDraft(menu.data ?? [], locked);
  const canConfirm = menu.status === "success" && !locked && draft.isValid;

  const onConfirmOrder = () => {
    if (!canConfirm || isLocked()) {
      return;
    }
    const { lines, received } = draft.capture();
    void submit(lines, received);
  };

  const onChangeQuantity = (item: MenuItem, delta: -1 | 1) => {
    if (isLocked() || menu.status === "denied") {
      return;
    }
    if (delta > 0 && menu.status !== "success") {
      return;
    }
    reset();
    draft.changeQuantity(item, delta);
  };

  const onChangeReceived = (value: number | null) => {
    if (!isLocked() && menu.status !== "denied") {
      draft.changeReceived(value);
    }
  };

  const onStartNextOrder = () => {
    if (state.status === "confirmed") {
      draft.reset();
      reset();
    }
  };

  let confirmation: OrderEntryPageUIProps["confirmation"];
  if (state.status === "confirmed") {
    if (previousOrder === null) {
      throw new Error("確定した注文の控えがありません。");
    }
    confirmation = { status: "confirmed", receipt: previousOrder };
  } else if (state.status === "uncertain") {
    confirmation = { status: "uncertain", rejection: state.rejection };
  } else if (state.status === "failed") {
    confirmation = state;
  } else {
    confirmation = { status: state.status };
  }

  return (
    <OrderEntryPageUI
      menu={menu}
      realtimeConnected={realtimeConnected}
      draft={{ ...draft.values, checkout: draft.checkout, shortages: draft.shortages }}
      confirmation={confirmation}
      canConfirm={canConfirm}
      previousOrder={previousOrder}
      onRefreshMenu={refreshMenu}
      onChangeQuantity={onChangeQuantity}
      onChangeReceived={onChangeReceived}
      onConfirmOrder={onConfirmOrder}
      onRetryConfirmation={() => {
        void retry();
      }}
      onStartNextOrder={onStartNextOrder}
    />
  );
};
