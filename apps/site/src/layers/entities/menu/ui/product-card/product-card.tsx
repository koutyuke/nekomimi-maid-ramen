import { motion } from "motion/react";

import { squircleRadius } from "../../../../shared/config";
import { ProductImage } from "../product-image/product-image";
import type { MenuItem } from "../../model/menu";

type ProductCardProps = {
  item: MenuItem;
  className?: string;
  onSelect: (card: HTMLButtonElement) => void;
};

/*
 * - 傾きはCSSの`rotate`で付ける。Motionの`rotate`だと、縮み終えて測り直す1コマだけ傾きが外れて震える。
 * - 角丸は`style`で渡し、Motionに伸び縮みを補正させる。
 * - 文字のまとまりにも`layout`を付け、カードと一緒に引き伸ばされないようにする。
 */
const CARD_STYLE = { borderRadius: squircleRadius(64) };

const cardClassName =
  "relative overflow-hidden border-4 border-tomato-7 [corner-shape:squircle] bg-tomato-1 text-tomato-12 outline-none focus-visible:ring-4 focus-visible:ring-blue-8";

export const FoodCard = ({ item, className = "", onSelect }: ProductCardProps) => (
  <motion.button
    type="button"
    layoutId={`menu-card-${item.id}`}
    style={CARD_STYLE}
    onClick={(event) => onSelect(event.currentTarget)}
    className={`${cardClassName} @container block aspect-video w-full shadow-lg ${className}`}
  >
    <span className="absolute top-1/2 left-[-16.25%] w-[68.75%] -translate-y-1/2">
      <ProductImage item={item} className="w-full" />
    </span>
    <motion.span
      layout
      className="absolute inset-y-0 right-[5.6%] left-[59.4%] flex flex-col items-center justify-center"
    >
      <span className="text-[7.5cqw] leading-[11.25cqw] font-bold">{item.name}</span>
      <span className="font-caveat text-[4.5cqw] leading-[6cqw] font-normal text-tomato-11">{item.subtitle}</span>
      <span className="mt-[5cqw] text-[7.5cqw] leading-[11.25cqw] font-bold text-tomato-10">¥{item.price}</span>
    </motion.span>
  </motion.button>
);

export const DrinkCard = ({ item, className = "", onSelect }: ProductCardProps) => (
  <motion.button
    type="button"
    layoutId={`menu-card-${item.id}`}
    style={CARD_STYLE}
    onClick={(event) => onSelect(event.currentTarget)}
    className={`${cardClassName} @container flex aspect-152/180 w-full flex-col items-center p-[calc(100%*10/152)] shadow-md ${className}`}
  >
    <ProductImage item={item} className="my-auto w-[calc(100cqw*36/152)]" />
    <motion.span layout className="flex flex-col items-center">
      <span className="text-[calc(100cqw*18/152)] leading-[calc(100cqw*24/152)] font-bold whitespace-nowrap">
        {item.name}
      </span>
      <span className="font-caveat text-[calc(100cqw*16/152)] leading-[calc(100cqw*20/152)] font-normal text-tomato-11">
        {item.subtitle}
      </span>
      <span className="text-[calc(100cqw*18/152)] leading-[calc(100cqw*24/152)] font-bold text-tomato-9">
        ¥{item.price}
      </span>
    </motion.span>
  </motion.button>
);
