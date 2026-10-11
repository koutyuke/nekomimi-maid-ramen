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
    /* 保存が拒否された環境では、端末設定から始める。 */
  }
  return "system";
};

const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 保存できなくても配色の変更は維持する。 */
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(readStoredTheme);

  // 描画前に反映し、保存したテーマと異なる配色が一瞬表示されることを防ぐ。
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    // Radix Colorsの暗い配色は`dark`クラスだけを見るため、`data-theme`属性と同時に付け替える。
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
