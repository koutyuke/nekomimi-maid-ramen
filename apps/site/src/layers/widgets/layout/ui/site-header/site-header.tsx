import { ThemeMenu } from "../../../../features/theme";
import { HamburgerMenu } from "../hamburger-menu/hamburger-menu";
import { SiteHeaderUI } from "./site-header.ui";

export const SiteHeader = () => <SiteHeaderUI hamburgerMenu={<HamburgerMenu />} themeMenu={<ThemeMenu />} />;
