export const setupTheme = (select: HTMLSelectElement): void => {
  let theme = "system";
  try {
    const stored = localStorage.getItem("site-theme");
    if (stored === "light" || stored === "dark") {
      theme = stored;
    }
  } catch {
    /* 保存が拒否された環境では、表示中の選択だけを適用する。 */
  }
  select.value = theme;
  document.documentElement.dataset["theme"] = theme;
  select.addEventListener("change", () => {
    document.documentElement.dataset["theme"] = select.value;
    try {
      localStorage.setItem("site-theme", select.value);
    } catch {
      /* 保存できなくても配色の変更は維持する。 */
    }
  });
};
