import type { Meta, StoryObj } from "@storybook/react-vite";

import { IMAGES } from "../../model/images";
import { BlurImage } from "./blur-image";

const meta = {
  title: "Pages/Home/BlurImage",
  component: BlurImage,
  args: {
    src: IMAGES.ramen.src,
    placeholder: IMAGES.ramen.placeholder,
    alt: "ラーメン",
    className: "size-55",
  },
} satisfies Meta<typeof BlurImage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};

// 本画像を読み込めない場合に、代替画像がどう見えるかを確かめる。
export const PlaceholderOnly: Story = { args: { src: "/missing-image.webp" } };
