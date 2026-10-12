import { allergenIconProps } from "./icon-props";
import type { IconProps } from "./icon-props";

export const BuckwheatIcon = (props: IconProps) => (
  <svg {...allergenIconProps} {...props}>
    <path d="M12 3C7.20005 5.2 3.80005 9.8 3.80005 14.9C3.80005 18.5 7.60005 20.2 12 21C16.4 20.2 20.2001 18.5 20.2001 14.9C20.2001 9.8 16.8 5.2 12 3Z" />
    <path d="M12 6.5V17.7" />
  </svg>
);
