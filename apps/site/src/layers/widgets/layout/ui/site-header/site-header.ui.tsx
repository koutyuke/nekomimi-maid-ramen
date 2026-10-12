import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import brandIcon from "../../../../shared/assets/brand-icon.svg";
import brandLogo from "../../../../shared/assets/brand-logo-start.svg";
import { HOME_SECTION_IDS } from "../../../../shared/config";

type SiteHeaderUIProps = {
  hamburgerMenu: ReactNode;
  themeMenu: ReactNode;
};

export const SiteHeaderUI = ({ hamburgerMenu, themeMenu }: SiteHeaderUIProps) => (
  <header className="fixed inset-x-0 top-4 z-10 mx-auto flex h-16 w-[calc(100%-32px)] max-w-100 items-center justify-between rounded-3xl border-2 border-slate-6 bg-slate-1/70 px-2 shadow-md backdrop-blur-lg">
    {hamburgerMenu}
    <Link
      to="/"
      hash={HOME_SECTION_IDS.top}
      className="absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
    >
      <img src={brandIcon} alt="" className="size-12" />
      <img src={brandLogo} alt="猫耳メイドラーメン" className="h-10" />
    </Link>
    {themeMenu}
  </header>
);
