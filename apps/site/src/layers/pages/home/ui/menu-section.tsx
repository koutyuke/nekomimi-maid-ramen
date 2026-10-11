import { Wave } from "../../../shared/ui";
import { HOME_SECTION_IDS } from "../model/sections";
import { SectionTitle } from "./section-title";

export const MenuSection = () => (
  <section
    id={HOME_SECTION_IDS.menu}
    aria-label="メニュー"
    className="bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-tomato-3 px-4 pt-2 pb-24 [--grid-color:var(--tomato-4)]"
  >
    <Wave className="absolute bottom-full left-0 h-18 w-full text-tomato-3" />
    <SectionTitle>お料理</SectionTitle>
    <SectionTitle id={HOME_SECTION_IDS.drinks}>飲み物</SectionTitle>
    <p className="mt-6 text-sm text-tomato-12">ご注文は店頭でメイドにお伝えください</p>
  </section>
);
