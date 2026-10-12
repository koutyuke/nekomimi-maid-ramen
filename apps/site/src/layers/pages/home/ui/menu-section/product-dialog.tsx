import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import type { RefObject } from "react";

import { PRODUCT_TITLE_ID, ProductDetail } from "../../../../entities/menu";
import { squircleRadius } from "../../../../shared/config";
import type { MenuItem } from "../../../../entities/menu";

type ProductDialogProps = {
  selected: MenuItem | null;
  onClose: () => void;
  // 閉じた後のフォーカスの戻り先。
  selectedCard: RefObject<HTMLButtonElement | null>;
};

export const ProductDialog = ({ selected, onClose, selectedCard }: ProductDialogProps) => {
  const dialogActions = useRef<Dialog.Root.Actions>(null);

  return (
    <Dialog.Root
      open={selected !== null}
      actionsRef={dialogActions}
      onOpenChange={(open, eventDetails) => {
        if (!open) {
          // 元のカードへ縮むアニメーションの間も詳細を残すため、外す時期はAnimatePresenceの完了に合わせる。
          eventDetails.preventUnmountOnClose();
          onClose();
        }
      }}
    >
      <AnimatePresence onExitComplete={() => dialogActions.current?.unmount()}>
        {selected && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 bg-black/20 backdrop-blur-lg"
              render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            />
            {/* カードと同じ`layoutId`で、選んだカードの位置と大きさから詳細の枠へ拡大する。 */}
            {/* タップでボタンにフォーカスが移らないブラウザもあるため、閉じた後の戻り先は選んだカードを指定する。 */}
            <Dialog.Popup
              aria-labelledby={PRODUCT_TITLE_ID}
              finalFocus={selectedCard}
              className="fixed inset-0 m-auto h-[80svh] w-[min(calc(100vw-64px),476px)] overflow-hidden border-4 border-tomato-6 bg-tomato-1 outline-none"
              render={
                <motion.div
                  layoutId={`menu-card-${selected.id}`}
                  style={{ borderRadius: squircleRadius(32) }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                />
              }
            >
              <div className="h-full overflow-y-auto">
                <ProductDetail item={selected} />
              </div>
              <Dialog.Close
                aria-label="閉じる"
                className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-xl bg-slate-3 text-slate-12 transition-colors outline-none hover:bg-slate-4 focus-visible:ring-2 focus-visible:ring-blue-8"
              >
                <X className="size-8" aria-hidden />
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
