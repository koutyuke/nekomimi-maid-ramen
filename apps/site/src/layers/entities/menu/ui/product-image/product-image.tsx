import { motion } from "motion/react";
import type { CSSProperties } from "react";

import { BlurImage } from "../../../../shared/ui";
import type { MenuItem } from "../../model/menu";

type ProductImageProps = {
  item: MenuItem;
  className?: string;
  fit?: CSSProperties["objectFit"];
};

const ILLUSTRATION_ASPECT_RATIO = "276 / 687";

export const ProductImage = ({ item, className = "", fit }: ProductImageProps) => (
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
      <BlurImage
        src={item.image.photo.src}
        srcSet={item.image.photo.srcSet}
        sizes={item.image.photo.sizes}
        placeholder={item.image.photo.placeholder}
        alt=""
        className="size-full"
        fit={fit}
      />
    ) : (
      <img src={item.image.src} alt="" loading="lazy" className="size-full" style={{ objectFit: fit ?? "contain" }} />
    )}
  </motion.div>
);
