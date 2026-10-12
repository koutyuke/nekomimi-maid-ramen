import { SunMoon } from "lucide-react";
import type { ComponentProps } from "react";

export const ThemeMenuButton = (props: ComponentProps<"button">) => (
  <button
    type="button"
    aria-label="テーマを切り替える"
    className="flex size-11 items-center justify-center rounded-xl bg-slate-3 text-slate-12 transition-[background-color] outline-none hover:bg-slate-4 focus-visible:ring-2 focus-visible:ring-blue-8"
    {...props}
  >
    <SunMoon className="size-7" aria-hidden />
  </button>
);
