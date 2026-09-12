import { useConfirmOrder } from "../../model/use-confirm-order";
import { useOrderDraft } from "../../model/use-order-draft";
import { useOrderEntry } from "../../model/use-order-entry";
import { OrderEntryPageUI } from "./order-entry-page.ui";
import type { MenuItem } from "../../../../entities/menu";

export const OrderEntryPage = () => {
  const { access, items, menuLoading, menuFailed, connected, onRetry } = useOrderEntry();
  const { pending, uncertain, result, previousOrder, locked, isLocked, submit, clearResult } = useConfirmOrder();
  const draft = useOrderDraft(items, locked);

  const canConfirm = access === "allowed" && !locked && !menuFailed && !menuLoading && draft.canConfirm;
  const canSubmit = access === "allowed" && !pending && result?.kind !== "confirmed" && (uncertain || canConfirm);

  const onSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const { lines, received } = draft.snapshot();
    void submit(lines, received);
  };

  const onStep = (item: MenuItem, delta: -1 | 1) => {
    if (isLocked()) {
      return;
    }
    clearResult();
    if (delta < 0 || !menuFailed) {
      draft.step(item, delta);
    }
  };

  const onReceived = (value: string) => {
    if (!isLocked()) {
      draft.receive(value);
    }
  };

  const onNext = () => {
    if (result?.kind === "confirmed") {
      draft.reset();
      clearResult();
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  };

  return (
    <OrderEntryPageUI
      access={access}
      items={items}
      menuLoading={menuLoading}
      menuFailed={menuFailed}
      connected={connected}
      lines={draft.lines}
      received={draft.received}
      checkout={draft.checkout}
      shortages={draft.shortages}
      submission={{ pending, uncertain, locked: locked, canConfirm, canSubmit }}
      result={result}
      previousOrder={previousOrder}
      actions={{ onRetry, onStep, onReceived, onSubmit, onNext }}
    />
  );
};
