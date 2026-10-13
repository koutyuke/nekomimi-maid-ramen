import maidIllustrationPlaceholder from "../assets/maid-illustration.png?w=32&format=webp&quality=40&inline&imagetools";
import maidIllustration from "../assets/maid-illustration.png?w=552&format=avif&imagetools";
import maidIllustrationSrcSet from "../assets/maid-illustration.png?w=184;368;552&format=avif&as=srcset&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

export const MAID_ILLUSTRATION: OptimizedImage = {
  src: maidIllustration,
  srcSet: maidIllustrationSrcSet,
  sizes: "184px",
  placeholder: maidIllustrationPlaceholder,
  width: 768,
  height: 1024,
};
