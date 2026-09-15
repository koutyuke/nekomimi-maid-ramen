import { HamburgerMenu } from "./hamburger-menu";
import { HeaderUI } from "./header.ui";

export const Header = () => {
  return <HeaderUI hamburgerMenu={<HamburgerMenu />} />;
};
