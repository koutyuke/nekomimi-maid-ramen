import { Menu } from "@base-ui/react/menu";
import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { useTheme } from "../model/theme";
import type { Theme } from "../model/theme";

const THEME_OPTIONS: readonly { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "ライト", Icon: Sun },
  { value: "dark", label: "ダーク", Icon: Moon },
  { value: "system", label: "端末設定に合わせる", Icon: Monitor },
];

const isTheme = (value: unknown): value is Theme => THEME_OPTIONS.some((option) => option.value === value);

// 選択したときに線が描かれるチェックマーク。
const AnimatedCheck = () => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-4"
      aria-hidden
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
    >
      <motion.path
        d="m4 12 5 5L20 6"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.22 }}
      />
    </motion.svg>
  );
};

export const ThemeMenu = () => {
  const [theme, setTheme] = useTheme();
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="テーマを切り替える"
        className="flex size-9 items-center justify-center rounded-lg bg-slate-3 text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
      >
        <SunMoon className="size-6" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={12}>
          <Menu.Popup className="flex flex-col gap-2 rounded-xl border-2 border-slate-6 bg-slate-1 p-2 shadow-lg outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Menu.RadioGroup
              value={theme}
              onValueChange={(value: unknown) => {
                if (isTheme(value)) {
                  setTheme(value);
                }
              }}
              className="flex flex-col gap-2"
            >
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <Menu.RadioItem
                  key={value}
                  value={value}
                  closeOnClick
                  className="grid min-h-6 cursor-default grid-cols-[24px_1fr_24px] items-center gap-1 rounded-md pr-1 text-sm text-slate-12 outline-none select-none data-highlighted:bg-slate-3"
                >
                  <Icon className="size-4 justify-self-center" aria-hidden />
                  <span>{label}</span>
                  <Menu.RadioItemIndicator className="justify-self-center">
                    <AnimatedCheck />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
