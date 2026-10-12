import { motion } from "motion/react";

import { BlurImage } from "../../../../shared/ui";
import type { MenuItem } from "../../model/menu";

type ProductImageProps = {
  item: MenuItem;
  className?: string;
};

// 飲み物の瓶のイラストは、どれも276×687で描いている。
const ILLUSTRATION_ASPECT_RATIO = "276 / 687";

// カードと詳細で同じ`layoutId`を使い、カードの写真が詳細の位置へ連続して移動・拡大するようにする。
// 移動の間は枠を縦横別々に伸縮させるため、枠の縦横比を画像に合わせ、カードと詳細で同じにして中身が歪まないようにする。
// 商品名がすぐ隣に書かれているため、写真は読み上げない。
export const ProductImage = ({ item, className = "" }: ProductImageProps) => (
  <motion.div
    layoutId={`menu-image-${item.id}`}
    className={className}
    style={{
      aspectRatio:
        item.image.kind === "photo"
          ? `${item.image.photo.width} / ${item.image.photo.height}`
          : ILLUSTRATION_ASPECT_RATIO,
    }}
  >
    {item.image.kind === "photo" ? (
      <BlurImage src={item.image.photo.src} placeholder={item.image.photo.placeholder} alt="" className="size-full" />
    ) : (
      <img src={item.image.src} alt="" className="size-full object-contain" />
    )}
  </motion.div>
);
