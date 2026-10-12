import { lineIconProps } from "./icon-props";
import type { IconProps } from "./icon-props";

export const InstagramIcon = (props: IconProps) => (
  <svg {...lineIconProps} {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <path d="M17.5 6.5h.01" />
  </svg>
);
