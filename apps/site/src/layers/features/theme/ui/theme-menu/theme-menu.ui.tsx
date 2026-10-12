import { Menu } from "@base-ui/react/menu";
import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Ref } from "react";

import { AnimatedCheckIcon } from "../../../../shared/ui";
import { ThemeMenuButton } from "./theme-menu-button";
import type { Theme } from "../../model/theme";

const THEME_OPTIONS: readonly { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "ライト", Icon: Sun },
  { value: "dark", label: "ダーク", Icon: Moon },
  { value: "system", label: "システム", Icon: Monitor },
];

const isTheme = (value: unknown): value is Theme => THEME_OPTIONS.some((option) => option.value === value);

type ThemeMenuUIProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  defaultOpen?: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
};

export const ThemeMenuUI = ({ theme, onThemeChange, defaultOpen, triggerRef }: ThemeMenuUIProps) => {
  return (
    <Menu.Root defaultOpen={defaultOpen}>
      <Menu.Trigger ref={triggerRef} render={<ThemeMenuButton />} />
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={12}>
          <Menu.Popup className="rounded-2xl border-2 border-slate-6 bg-slate-1 p-2 shadow-lg transition-[opacity,scale] duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none starting:scale-95 starting:opacity-0">
            <Menu.RadioGroup
              value={theme}
              onValueChange={(value: unknown) => {
                if (isTheme(value)) {
                  onThemeChange(value);
                }
              }}
              className="flex flex-col gap-0.5"
            >
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <Menu.RadioItem
                  key={value}
                  value={value}
                  closeOnClick
                  className="text-md grid min-h-9 cursor-default grid-cols-[32px_1fr_32px] items-center gap-1 rounded-lg bg-none text-slate-12 transition outline-none select-none data-highlighted:bg-slate-3"
                >
                  <Icon className="size-5 justify-self-center" aria-hidden />
                  <span>{label}</span>
                  <Menu.RadioItemIndicator className="justify-self-center">
                    <AnimatedCheckIcon className="size-5" />
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
