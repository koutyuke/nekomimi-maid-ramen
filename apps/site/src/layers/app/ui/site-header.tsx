import { Link } from "@tanstack/react-router";

import { ThemeSelect } from "../../features/theme";

export const SiteHeader = () => (
  <header className="flex flex-wrap items-center justify-between gap-4">
    <Link to="/" className="font-bold">
      猫耳メイドラーメン
    </Link>
    <ThemeSelect />
  </header>
);
