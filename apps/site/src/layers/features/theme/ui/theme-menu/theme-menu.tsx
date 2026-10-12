import { useEffect, useRef, useState } from "react";

import { useTheme } from "../../model/theme";
import { ThemeMenuButton } from "./theme-menu-button";
import type { ThemeMenuUI } from "./theme-menu.ui";

// メニューの部品(Base UIのMenuとMotion)は初期表示に不要なため、同じ見た目のボタンだけを先に置き、触れたときに読み込んで差し替える。
// 読み込みより先に押されたときは開いた状態で、ボタンにフォーカスがあったときはフォーカスを引き継いで差し替える。
const loadThemeMenuUI = () => import("./theme-menu.ui").then((module) => module.ThemeMenuUI);

type Loaded = { Menu: typeof ThemeMenuUI; open: boolean; refocus: boolean };

export const ThemeMenu = () => {
  const [theme, setTheme] = useTheme();
  const [loaded, setLoaded] = useState<Loaded>();
  const openRequested = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (loaded?.refocus) {
      trigger.current?.focus();
    }
  }, [loaded]);

  if (loaded) {
    return <loaded.Menu theme={theme} onThemeChange={setTheme} defaultOpen={loaded.open} triggerRef={trigger} />;
  }

  const load = async (button: HTMLButtonElement) => {
    const Menu = await loadThemeMenuUI();
    // 開く場合はBase UIがメニューへフォーカスを移すため、ボタンへ戻さない。
    const open = openRequested.current;
    setLoaded((current) => current ?? { Menu, open, refocus: !open && document.activeElement === button });
  };

  return (
    <ThemeMenuButton
      onPointerEnter={(event) => void load(event.currentTarget)}
      onFocus={(event) => void load(event.currentTarget)}
      onClick={(event) => {
        openRequested.current = true;
        void load(event.currentTarget);
      }}
    />
  );
};
