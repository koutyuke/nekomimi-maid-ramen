import { Select } from "@base-ui/react/select";

import { useTheme } from "../model/theme";
import type { Theme } from "../model/theme";

const THEME_OPTIONS: readonly { value: Theme; label: string }[] = [
  { value: "system", label: "端末設定に合わせる" },
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
];

export const ThemeSelect = () => {
  const [theme, setTheme] = useTheme();
  return (
    <Select.Root
      items={THEME_OPTIONS}
      value={theme}
      onValueChange={(value) => {
        if (value !== null) {
          setTheme(value);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <Select.Label>テーマ</Select.Label>
        <Select.Trigger className="flex min-h-11 items-center gap-2 rounded border border-gray-7 bg-gray-1 px-3 hover:bg-gray-3 focus-visible:outline-2 focus-visible:outline-blue-8">
          <Select.Value />
          <Select.Icon aria-hidden>▾</Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner sideOffset={4}>
          <Select.Popup className="min-w-(--anchor-width) rounded border border-gray-6 bg-gray-2 py-1 shadow-md">
            <Select.List>
              {THEME_OPTIONS.map(({ value, label }) => (
                <Select.Item
                  key={value}
                  value={value}
                  className="grid min-h-11 cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-3 outline-none select-none data-highlighted:bg-gray-4"
                >
                  <Select.ItemIndicator className="col-start-1">✓</Select.ItemIndicator>
                  <Select.ItemText className="col-start-2">{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};
