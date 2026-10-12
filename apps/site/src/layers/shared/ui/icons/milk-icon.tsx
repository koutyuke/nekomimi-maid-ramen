import { allergenIconProps } from "./icon-props";
import type { IconProps } from "./icon-props";

export const MilkIcon = (props: IconProps) => (
  <svg {...allergenIconProps} {...props}>
    <path d="M7 7L9 3H16L20 7V20.2C20 20.7333 19.7333 21 19.2 21H7.8C7.26667 21 7 20.7333 7 20.2V7Z" />
    <path d="M7 7H16M16 7H20M16 7V21M16 7V3" />
    <path d="M11.5 10.5C10.7 11.6 9.30005 13.2 9.30005 14.4C9.30005 15.7 10.3 16.6 11.5 16.6C12.7 16.6 13.7 15.7 13.7 14.4C13.7 13.2 12.3 11.6 11.5 10.5Z" />
  </svg>
);
