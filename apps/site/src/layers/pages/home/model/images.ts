import maidIllustrationPlaceholder from "../assets/maid-illustration.png?w=32&format=webp&quality=40&inline&imagetools";
import maidIllustration from "../assets/maid-illustration.png?w=552&format=webp&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

// 本画像の幅は、スマートフォンの3倍密度の画面で表示幅(184px)を満たす大きさにする。
export const MAID_ILLUSTRATION: OptimizedImage = {
  src: maidIllustration,
  placeholder: maidIllustrationPlaceholder,
  width: 768,
  height: 1024,
};
