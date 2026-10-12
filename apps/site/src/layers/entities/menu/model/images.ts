import gyozaPlaceholder from "../assets/gyoza.png?w=32&format=webp&quality=40&inline&imagetools";
import gyoza from "../assets/gyoza.png?w=660&format=webp&imagetools";
import ramenPlaceholder from "../assets/ramen.png?w=32&format=webp&quality=40&inline&imagetools";
import ramen from "../assets/ramen.png?w=660&format=webp&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

// 本画像の幅は、スマートフォンの3倍密度の画面で表示幅(220px)を満たす大きさにする。
export const MENU_PHOTOS = {
  ramen: { src: ramen, placeholder: ramenPlaceholder, width: 1024, height: 1024 },
  gyoza: { src: gyoza, placeholder: gyozaPlaceholder, width: 1024, height: 552 },
} as const satisfies Record<string, OptimizedImage>;
