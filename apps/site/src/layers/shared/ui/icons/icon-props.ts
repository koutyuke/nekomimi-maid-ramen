import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export const lineIconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const allergenIconProps = { ...lineIconProps, strokeWidth: 1.5 } as const;
