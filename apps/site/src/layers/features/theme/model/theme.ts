import { useLayoutEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "site-theme";

const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    /* 保存が拒否された環境では端末設定に従う。 */
  }
  return "system";
};

const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 保存できなくても配色は変える。 */
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(readStoredTheme);

  // 描画前に反映し、保存と異なる配色が一瞬見えるのを防ぐ。
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    // Radix Colorsの暗い配色は`dark`クラスを見るため、`data-theme`属性とそろえる。
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      const root = document.documentElement;
      root.dataset["theme"] = dark ? "dark" : "light";
      root.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    saveTheme(next);
  };

  return [theme, changeTheme] as const;
};
