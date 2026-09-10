import { MENU_CATEGORY_LABEL } from "@nekomimi/core/models";
import type { MenuItem } from "@nekomimi/core/models";

const textElement = (tag: string, text: string): HTMLElement => {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
};

export const renderMenuLoading = (root: HTMLElement): void => {
  root.replaceChildren(textElement("p", "メニューを読み込んでいます"));
};

export const renderMenuItems = (root: HTMLElement, items: readonly MenuItem[]): void => {
  const content = document.createDocumentFragment();
  for (const [category, categoryItems] of Map.groupBy(items, (item) => item.category)) {
    const section = document.createElement("section");
    section.append(textElement("h2", MENU_CATEGORY_LABEL[category]));
    for (const item of categoryItems) {
      const card = document.createElement("article");
      card.append(textElement("h3", item.name), textElement("p", `${item.price.toLocaleString("ja-JP")}円`));
      card.append(textElement("strong", item.sellable ? "販売中" : "売り切れ"));
      if (item.description !== null) {
        card.append(textElement("p", item.description));
      }
      const allergens =
        item.allergenCheckState === "unchecked"
          ? "未確認"
          : item.containedAllergens.map((allergen) => allergen.name).join("・") || "含まれない";
      card.append(textElement("p", `特定原材料: ${allergens}`));
      section.append(card);
    }
    content.append(section);
  }
  if (items.length === 0) {
    content.append(textElement("p", "表示できる商品がありません。"));
  }
  root.replaceChildren(content);
};

export const renderMenuError = (root: HTMLElement, retry: () => void): void => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "再読み込み";
  button.addEventListener("click", retry);
  root.replaceChildren(
    textElement("p", "メニューを表示できません。通信状況を確認して、もう一度お試しください。"),
    button,
  );
};
