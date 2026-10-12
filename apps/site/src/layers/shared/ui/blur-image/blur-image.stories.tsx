import type { Meta, StoryObj } from "@storybook/react-vite";

import brandIcon from "../../assets/brand-icon.svg";
import { BlurImage } from "./blur-image";

// 縮めた写真をぼかした代替画像の代わりに、ぼかした見え方を確かめるための小さな画像。
const PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#fde2dc"/><circle cx="2" cy="2" r="1.4" fill="#dd4425"/></svg>',
)}`;

const meta = {
  title: "Shared/BlurImage",
  component: BlurImage,
  args: { src: brandIcon, placeholder: PLACEHOLDER, alt: "猫耳メイドラーメンのロゴ", className: "size-55" },
} satisfies Meta<typeof BlurImage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};

// 本画像を読み込めない場合に、代替画像がどう見えるかを確かめる。
export const PlaceholderOnly: Story = { args: { src: "/missing-image.webp" } };
