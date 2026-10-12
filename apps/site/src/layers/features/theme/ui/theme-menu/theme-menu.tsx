import { useTheme } from "../../model/theme";
import { ThemeMenuUI } from "./theme-menu.ui";

export const ThemeMenu = () => {
  const [theme, setTheme] = useTheme();
  return <ThemeMenuUI theme={theme} onThemeChange={setTheme} />;
};
