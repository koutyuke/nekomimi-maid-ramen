import gyozaPlaceholder from "../assets/gyoza.png?w=32&format=webp&quality=40&inline&imagetools";
import gyoza from "../assets/gyoza.png?w=800&format=avif&imagetools";
import gyozaSrcSet from "../assets/gyoza.png?w=320;480;640;800&format=avif&as=srcset&imagetools";
import ramenPlaceholder from "../assets/ramen.png?w=32&format=webp&quality=40&inline&imagetools";
import ramen from "../assets/ramen.png?w=800&format=avif&imagetools";
import ramenSrcSet from "../assets/ramen.png?w=320;480;640;800&format=avif&as=srcset&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

// 詳細を開いたときに別の画像を読み込み直さないよう、`sizes`はカードの表示幅に合わせて詳細と共通にする。
const SIZES = "(min-width: 450px) 270px, 60vw";

export const MENU_PHOTOS = {
  ramen: { src: ramen, srcSet: ramenSrcSet, sizes: SIZES, placeholder: ramenPlaceholder, width: 1024, height: 1024 },
  gyoza: { src: gyoza, srcSet: gyozaSrcSet, sizes: SIZES, placeholder: gyozaPlaceholder, width: 1024, height: 552 },
} as const satisfies Record<string, OptimizedImage>;
