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
    const apply = () => {
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches));
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
