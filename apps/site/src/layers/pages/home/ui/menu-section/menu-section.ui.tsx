import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useRef, useState } from "react";

import { DrinkCard, FoodCard, PRODUCT_TITLE_ID, ProductDetail } from "../../../../entities/menu";
import { HOME_SECTION_IDS, squircleRadius } from "../../../../shared/config";
import { Reveal, Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";
import type { MenuItem } from "../../../../entities/menu";

const FOOD_ROTATIONS = ["rotate-2", "-rotate-2"];

// 飲み物は2列で互い違いに並べる。各カードは2行分を占める。
// 行と隙間は幅320pxのデザインに対する割合(1px = 0.3125cqw)で決め、カードと一緒に拡大・縮小する。
const DRINK_LAYOUTS = [
  { rotate: "rotate-2", className: "col-start-1 row-span-2 row-start-1" },
  { rotate: "-rotate-2", className: "col-start-2 row-span-2 row-start-2" },
  { rotate: "-rotate-4", className: "col-start-1 row-span-2 row-start-3" },
  { rotate: "rotate-4", className: "col-start-2 row-span-2 row-start-4" },
];

type MenuSectionUIProps = {
  items: readonly MenuItem[];
};

export const MenuSectionUI = ({ items }: MenuSectionUIProps) => {
  const foods = items.filter((item) => item.category !== "drink");
  const drinks = items.filter((item) => item.category === "drink");

  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [raisedId, setRaisedId] = useState<string | null>(null);

  const selectedCard = useRef<HTMLButtonElement | null>(null);
  const dialogActions = useRef<Dialog.Root.Actions>(null);

  const select = (item: MenuItem) => (card: HTMLButtonElement) => {
    selectedCard.current = card;
    setRaisedId(item.id);
    setSelected(item);
  };

  return (
    // カードと詳細の間の拡大・縮小の速さ。イージングはMotionの既定のまま、時間だけを短くする。
    <MotionConfig reducedMotion="user" transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.1, 1] } }}>
      <section
        id={HOME_SECTION_IDS.menu}
        aria-label="メニュー"
        className={`bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-tomato-3 px-6 pt-2 pb-32 [--grid-color:var(--tomato-4)]`}
      >
        <Wave className="bg-dashed-grid bg-tomato-3 [--grid-color:var(--tomato-4)]" />
        <SectionTitle>お料理</SectionTitle>
        <div className="mt-6 flex w-full max-w-content flex-col gap-6">
          {/* 浮かび上がりの`transform`で重なりの文脈が区切られるため、前面に出す`z-10`は外側に付ける。 */}
          {foods.map((item, index) => (
            <Reveal key={item.id} className={item.id === raisedId ? "z-10" : ""}>
              <FoodCard
                item={item}
                className={FOOD_ROTATIONS[index % FOOD_ROTATIONS.length] ?? ""}
                onSelect={select(item)}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-12">
          <SectionTitle id={HOME_SECTION_IDS.drinks}>飲み物</SectionTitle>
        </div>
        <div className="@container mt-4 w-full max-w-content">
          <div className="grid grid-cols-2 grid-rows-[repeat(5,28.125cqw)] gap-x-[5cqw] gap-y-[3.75cqw]">
            {drinks.map((item, index) => {
              const layout = DRINK_LAYOUTS[index % DRINK_LAYOUTS.length];
              return (
                <Reveal
                  key={item.id}
                  className={`flex items-center ${layout?.className ?? ""} ${item.id === raisedId ? "z-10" : ""}`}
                >
                  <DrinkCard
                    item={item}
                    className={`${layout?.rotate ?? ""} ${item.id === raisedId ? "z-10" : ""}`}
                    onSelect={select(item)}
                  />
                </Reveal>
              );
            })}
          </div>
        </div>
        <Reveal className="mt-6">
          <p className="text-md text-tomato-12">ご注文は店頭でメイドにお伝えください</p>
        </Reveal>

        <Dialog.Root
          open={selected !== null}
          actionsRef={dialogActions}
          onOpenChange={(open, eventDetails) => {
            if (!open) {
              // 元のカードへ縮むアニメーションの間も詳細を残すため、外す時期はAnimatePresenceの完了に合わせる。
              eventDetails.preventUnmountOnClose();
              setSelected(null);
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
      </section>
    </MotionConfig>
  );
};
