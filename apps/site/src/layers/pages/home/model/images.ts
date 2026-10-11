import maidIllustrationPlaceholder from "../assets/maid-illustration.png?w=32&format=webp&quality=40&inline&imagetools";
import maidIllustration from "../assets/maid-illustration.png?w=552&format=webp&imagetools";
import gyozaPlaceholder from "../assets/menu/gyoza.png?w=32&format=webp&quality=40&inline&imagetools";
import gyoza from "../assets/menu/gyoza.png?w=660&format=webp&imagetools";
import ramenPlaceholder from "../assets/menu/ramen.png?w=32&format=webp&quality=40&inline&imagetools";
import ramen from "../assets/menu/ramen.png?w=660&format=webp&imagetools";

export type OptimizedImage = {
  src: string;
  placeholder: string;
};

// 本画像の幅は、スマートフォンの3倍密度の画面で表示幅(料理は220px、イラストは184px)を満たす大きさにする。
export const IMAGES = {
  maidIllustration: { src: maidIllustration, placeholder: maidIllustrationPlaceholder },
  ramen: { src: ramen, placeholder: ramenPlaceholder },
  gyoza: { src: gyoza, placeholder: gyozaPlaceholder },
} as const satisfies Record<string, OptimizedImage>;
