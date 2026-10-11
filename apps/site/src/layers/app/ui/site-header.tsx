import { Link } from "@tanstack/react-router";

import { ThemeMenu } from "../../features/theme";
import { HOME_SECTION_IDS } from "../../pages/home";
import brandIcon from "../../shared/assets/brand-icon.svg";
import brandLogo from "../../shared/assets/brand-logo-start.svg";
import { HamburgerMenu } from "./hamburger-menu";

export const SiteHeader = () => (
  <header className="fixed inset-x-0 top-4 z-10 mx-auto flex h-13 w-[calc(100%-32px)] max-w-100 items-center justify-between rounded-xl border-2 border-slate-6 bg-slate-1/70 p-2.5 shadow-md backdrop-blur-lg">
    <HamburgerMenu />
    <Link
      to="/"
      hash={HOME_SECTION_IDS.top}
      className="absolute top-0.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
    >
      <img src={brandIcon} alt="" className="size-11" />
      <img src={brandLogo} alt="猫耳メイドラーメン" className="h-9 w-[71px]" />
    </Link>
    <ThemeMenu />
  </header>
);
