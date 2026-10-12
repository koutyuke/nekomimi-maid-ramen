import { motion } from "motion/react";

import { squircleRadius } from "../../../../shared/config";
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
 * カードは置き場所の幅いっぱいに広がり、比率を保って拡大・縮小する。中身もカード自身の幅に対する割合(`cqw`)で大きさを決める。
 */
const CARD_STYLE = { borderRadius: squircleRadius(64) };

const cardClassName =
  "relative overflow-hidden border-4 border-tomato-7 [corner-shape:squircle] bg-tomato-1 text-tomato-12 outline-none focus-visible:ring-4 focus-visible:ring-blue-8";

// 料理のカード。320×180の比率で、写真をカードの左端からはみ出させて置く。大きさは幅320pxのデザインに対する割合(1px = 0.3125cqw)で決める。
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
      <span className="font-caveat text-[4.5cqw] leading-[6cqw] text-tomato-11">{item.subtitle}</span>
      <span className="mt-[5cqw] text-[7.5cqw] leading-[11.25cqw] font-bold text-tomato-10">¥{item.price}</span>
    </motion.span>
  </motion.button>
);

// 飲み物のカード。中央に瓶のイラスト、下に名称と価格を置く。大きさは幅152pxのデザインに対する割合で決める。
// 余白はカード自身の`cqw`では測れないため、親の幅に対する割合(`%`)で指定する。
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
      <span className="font-caveat text-[calc(100cqw*16/152)] leading-[calc(100cqw*20/152)] text-tomato-11">
        {item.subtitle}
      </span>
      <span className="text-[calc(100cqw*18/152)] leading-[calc(100cqw*24/152)] font-bold text-tomato-9">
        ¥{item.price}
      </span>
    </motion.span>
  </motion.button>
);
