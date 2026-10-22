import kanai from "../assets/kanai-logo.png?w=800&format=avif&imagetools";
import kanaiSrcSet from "../assets/kanai-logo.png?w=320;480;640;800&format=avif&as=srcset&imagetools";
import kanaiPlaceholder from "../assets/kanai-logo.png?w=32&format=webp&quality=40&inline&imagetools";
import marushou from "../assets/marushou-logo.png?w=800&format=avif&imagetools";
import marushouSrcSet from "../assets/marushou-logo.png?w=320;480;640;800&format=avif&as=srcset&imagetools";
import marushouPlaceholder from "../assets/marushou-logo.png?w=32&format=webp&quality=40&inline&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

const SIZES = "(min-width: 448px) 400px, calc(100vw - 48px)";

export const IMAGES = {
  marushou: {
    src: marushou,
    srcSet: marushouSrcSet,
    sizes: SIZES,
    placeholder: marushouPlaceholder,
    width: 1000,
    height: 750,
  },
  kanai: {
    src: kanai,
    srcSet: kanaiSrcSet,
    sizes: SIZES,
    placeholder: kanaiPlaceholder,
    width: 1000,
    height: 750,
  },
} as const satisfies Record<string, OptimizedImage>;
