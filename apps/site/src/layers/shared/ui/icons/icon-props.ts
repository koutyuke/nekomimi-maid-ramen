import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

// Lucideの線のアイコンと太さ・端の形をそろえ、色は文字色に合わせる。
export const lineIconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

// 特定原材料のアイコンは、デザインに合わせて細い線にする。
export const allergenIconProps = { ...lineIconProps, strokeWidth: 1.5 } as const;
