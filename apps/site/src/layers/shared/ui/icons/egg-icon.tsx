import { allergenIconProps } from "./icon-props";
import type { IconProps } from "./icon-props";

export const EggIcon = (props: IconProps) => (
  <svg {...allergenIconProps} {...props}>
    <path d="M19 14C19 18.4 15.9 21 12 21C8.1 21 5 18.4 5 14C5 9.2 8.8 3 12 3C15.2 3 19 9.2 19 14Z" />
    <path d="M8.30004 13.3999C8.20004 15.5999 9.10004 16.9999 10.5 17.7999" />
  </svg>
);
