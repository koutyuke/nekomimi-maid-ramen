import { lineIconProps } from "./icon-props";
import type { IconProps } from "./icon-props";

// 上の線を猫耳の形にしたハンバーガーメニューのアイコン。
export const CatMenuIcon = (props: IconProps) => (
  <svg {...lineIconProps} {...props}>
    <path d="M4 8.889 6 7.937l2-3.048 2 3.048h4l2-3.048 2 3.048 2 .952M4 13.524h16M4 19.111h16" />
  </svg>
);
