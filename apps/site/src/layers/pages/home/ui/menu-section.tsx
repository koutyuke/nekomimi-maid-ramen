import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useState } from "react";

import { Wave } from "../../../shared/ui";
import { MENU_ITEMS } from "../model/menu";
import { HOME_SECTION_IDS } from "../model/sections";
import { DrinkCard, FoodCard } from "./product-card";
import { PRODUCT_TITLE_ID, ProductDetail } from "./product-detail";
import { SectionTitle } from "./section-title";
import type { MenuItem } from "../model/menu";

const foods = MENU_ITEMS.filter((item) => item.category !== "drink");
const drinks = MENU_ITEMS.filter((item) => item.category === "drink");

const FOOD_ROTATIONS = [2, -2];

// 飲み物は2列で互い違いに並べる。行は90pxごとに区切り、各カードは2行分を占める。
const DRINK_LAYOUTS = [
  { rotate: 2, className: "col-start-1 row-span-2 row-start-1" },
  { rotate: -2, className: "col-start-2 row-span-2 row-start-2" },
  { rotate: -4, className: "col-start-1 row-span-2 row-start-3" },
  { rotate: 4, className: "col-start-2 row-span-2 row-start-4" },
];

export const MenuSection = () => {
  const [selected, setSelected] = useState<MenuItem | null>(null);

  return (
    <MotionConfig reducedMotion="user">
      <section
        id={HOME_SECTION_IDS.menu}
        aria-label="メニュー"
        className="bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-tomato-3 px-4 pt-2 pb-24 [--grid-color:var(--tomato-4)]"
      >
        <Wave className="absolute bottom-full left-0 h-18 w-full text-tomato-3" />
        <SectionTitle>お料理</SectionTitle>
        <div className="mt-6 flex flex-col gap-4">
          {foods.map((item, index) => (
            <FoodCard
              key={item.id}
              item={item}
              rotate={FOOD_ROTATIONS[index % FOOD_ROTATIONS.length] ?? 0}
              onSelect={() => setSelected(item)}
            />
          ))}
        </div>
        <div className="mt-8">
          <SectionTitle id={HOME_SECTION_IDS.drinks}>飲み物</SectionTitle>
        </div>
        <div className="mt-4 grid w-80 grid-cols-2 grid-rows-[repeat(5,90px)] gap-x-4 gap-y-3">
          {drinks.map((item, index) => {
            const layout = DRINK_LAYOUTS[index % DRINK_LAYOUTS.length];
            return (
              <div key={item.id} className={`flex items-center ${layout?.className ?? ""}`}>
                <DrinkCard item={item} rotate={layout?.rotate ?? 0} onSelect={() => setSelected(item)} />
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-tomato-12">ご注文は店頭でメイドにお伝えください</p>

        <Dialog.Root
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelected(null);
            }
          }}
        >
          {/* 閉じるアニメーションの間も中身を残すため、Base UIではなくAnimatePresenceに外す時期を任せる。 */}
          <AnimatePresence>
            {selected && (
              <Dialog.Portal keepMounted>
                <Dialog.Backdrop
                  className="fixed inset-0 bg-black/20 backdrop-blur-lg"
                  render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
                />
                {/* カードと同じ`layoutId`で、選んだカードの位置と大きさから詳細の枠へ拡大する。 */}
                <Dialog.Popup
                  aria-labelledby={PRODUCT_TITLE_ID}
                  className="fixed inset-0 m-auto h-[80svh] w-[min(calc(100vw-64px),476px)] overflow-hidden rounded-3xl border-4 border-tomato-6 bg-tomato-1 outline-none"
                  render={<motion.div layoutId={`menu-card-${selected.id}`} style={{ rotate: 0 }} />}
                >
                  <div className="h-full overflow-y-auto">
                    <ProductDetail item={selected} />
                  </div>
                  <Dialog.Close
                    aria-label="閉じる"
                    className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-lg bg-slate-3 text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
                  >
                    <X className="size-6" aria-hidden />
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
