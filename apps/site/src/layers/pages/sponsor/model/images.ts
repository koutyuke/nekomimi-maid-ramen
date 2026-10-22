import setup from "../assets/kanai-setup.jpg?w=800&format=avif&imagetools";
import setupSrcSet from "../assets/kanai-setup.jpg?w=320;480;640;800&format=avif&as=srcset&imagetools";
import setupPlaceholder from "../assets/kanai-setup.jpg?w=32&format=webp&quality=40&inline&imagetools";
import stage from "../assets/kanai-stage.jpg?w=800&format=avif&imagetools";
import stageSrcSet from "../assets/kanai-stage.jpg?w=320;480;640;800&format=avif&as=srcset&imagetools";
import stagePlaceholder from "../assets/kanai-stage.jpg?w=32&format=webp&quality=40&inline&imagetools";
import kanai from "../assets/kanai-store.jpg?w=800&format=avif&imagetools";
import kanaiSrcSet from "../assets/kanai-store.jpg?w=320;480;640;800&format=avif&as=srcset&imagetools";
import kanaiPlaceholder from "../assets/kanai-store.jpg?w=32&format=webp&quality=40&inline&imagetools";
import marushou from "../assets/marushou.webp?w=800&format=avif&imagetools";
import marushouSrcSet from "../assets/marushou.webp?w=320;480;640;800&format=avif&as=srcset&imagetools";
import marushouPlaceholder from "../assets/marushou.webp?w=32&format=webp&quality=40&inline&imagetools";
import type { OptimizedImage } from "../../../shared/ui";

const SIZES = "(min-width: 448px) 400px, calc(100vw - 48px)";

export const IMAGES = {
  marushou: {
    src: marushou,
    srcSet: marushouSrcSet,
    sizes: SIZES,
    placeholder: marushouPlaceholder,
    width: 4000,
    height: 3000,
  },
  kanai: {
    src: kanai,
    srcSet: kanaiSrcSet,
    sizes: SIZES,
    placeholder: kanaiPlaceholder,
    width: 1536,
    height: 1024,
  },
  stage: {
    src: stage,
    srcSet: stageSrcSet,
    sizes: SIZES,
    placeholder: stagePlaceholder,
    width: 1477,
    height: 1108,
  },
  setup: {
    src: setup,
    srcSet: setupSrcSet,
    sizes: SIZES,
    placeholder: setupPlaceholder,
    width: 1477,
    height: 1108,
  },
} as const satisfies Record<string, OptimizedImage>;
