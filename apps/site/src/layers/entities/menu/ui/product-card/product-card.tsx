import { motion } from "motion/react";

import { ProductImage } from "../product-image/product-image";
import type { MenuItem } from "../../model/menu";

type ProductCardProps = {
  item: MenuItem;
  // 並べ方に応じた傾き(`rotate-2`など)と重なり順。
  className?: string;
  // 詳細を閉じたときにフォーカスを戻すため、選ばれたカードの要素を渡す。
  onSelect: (card: HTMLButtonElement) => void;
};

/*
 * カードは詳細と同じ`layoutId`で拡大・縮小し、その間はMotionが`transform`で大きさを変える。
 * - 傾きはCSSの`rotate`で付ける。Motionの`rotate`で持つと、縮み終えて位置を測り直す1コマだけ傾きが外れて震えて見える。
 * - 角丸は`style`で渡し、Motionに伸び縮みの補正をさせる。
 * - 文字のまとまりにも`layout`を付け、カードと一緒に引き伸ばされないようにする。
 */
const CARD_STYLE = { borderRadius: 24 };

const cardClassName =
  "relative overflow-hidden border-4 border-tomato-7 bg-tomato-1 text-tomato-12 outline-none focus-visible:ring-4 focus-visible:ring-blue-8";

// 料理のカード。320×180の比率で、写真をカードの左端からはみ出させて置く。位置と大きさはカードに対する割合で決める。
export const FoodCard = ({ item, className = "", onSelect }: ProductCardProps) => (
  <motion.button
    type="button"
    layoutId={`menu-card-${item.id}`}
    style={CARD_STYLE}
    onClick={(event) => onSelect(event.currentTarget)}
    className={`${cardClassName} block aspect-[16/9] w-80 shadow-lg ${className}`}
  >
    <span className="absolute top-1/2 left-[-16.25%] w-[68.75%] -translate-y-1/2">
      <ProductImage item={item} className="w-full" />
    </span>
    <motion.span
      layout
      className="absolute inset-y-0 right-[5.6%] left-[59.4%] flex flex-col items-center justify-center"
    >
      <span className="text-2xl leading-9 font-bold">{item.name}</span>
      <span className="font-caveat text-xs leading-4 text-tomato-11">{item.subtitle}</span>
      <span className="mt-4 text-2xl leading-9 font-bold text-tomato-10">¥{item.price}</span>
    </motion.span>
  </motion.button>
);

// 飲み物のカード。中央に瓶のイラスト、下に名称と価格を置く。
export const DrinkCard = ({ item, className = "", onSelect }: ProductCardProps) => (
  <motion.button
    type="button"
    layoutId={`menu-card-${item.id}`}
    style={CARD_STYLE}
    onClick={(event) => onSelect(event.currentTarget)}
    className={`${cardClassName} flex h-45 w-full flex-col items-center p-2.5 shadow-md ${className}`}
  >
    <ProductImage item={item} className="min-h-0 w-9 flex-1" />
    <motion.span layout className="flex flex-col items-center">
      <span className="leading-6 font-bold whitespace-nowrap">{item.name}</span>
      <span className="font-caveat text-xs leading-4 text-tomato-11">{item.subtitle}</span>
      <span className="leading-6 font-bold text-tomato-9">¥{item.price}</span>
    </motion.span>
  </motion.button>
);
