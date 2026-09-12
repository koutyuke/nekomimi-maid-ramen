import { getMenu } from "../api/get-menu";
import { renderMenuError, renderMenuItems, renderMenuLoading } from "../ui/menu-page/menu-page.view";
import type { MenuItem } from "./menu";

export const loadMenu = async (
  root: HTMLElement,
  getItems: () => Promise<readonly MenuItem[]> = getMenu,
): Promise<void> => {
  renderMenuLoading(root);
  root.setAttribute("aria-busy", "true");
  try {
    renderMenuItems(root, await getItems());
  } catch {
    renderMenuError(root, () => void loadMenu(root, getItems));
  } finally {
    root.setAttribute("aria-busy", "false");
  }
};
