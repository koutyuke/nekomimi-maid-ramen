import { motion } from "motion/react";

import { BlurImage } from "../../../../shared/ui";
import type { MenuItem } from "../../model/menu";

type ProductImageProps = {
  item: MenuItem;
  className?: string;
};

// カードと詳細で同じ`layoutId`を使い、カードの写真が詳細の位置へ連続して移動・拡大するようにする。
// 商品名がすぐ隣に書かれているため、写真は読み上げない。
export const ProductImage = ({ item, className = "" }: ProductImageProps) => (
  <motion.div
    layoutId={`menu-image-${item.id}`}
    className={className}
    style={item.image.kind === "photo" ? { aspectRatio: `${item.image.photo.width} / ${item.image.photo.height}` } : {}}
  >
    {item.image.kind === "photo" ? (
      <BlurImage src={item.image.photo.src} placeholder={item.image.photo.placeholder} alt="" className="size-full" />
    ) : (
      <img src={item.image.src} alt="" className="size-full object-contain" />
    )}
  </motion.div>
);
