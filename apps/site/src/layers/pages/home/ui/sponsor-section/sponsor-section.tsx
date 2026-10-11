import { Wave } from "../../../shared/ui";
import { HOME_SECTION_IDS } from "../model/sections";
import { SectionTitle } from "./section-title";

export const SponsorSection = () => (
  <section
    id={HOME_SECTION_IDS.sponsors}
    aria-label="ご協賛"
    className="bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-orange-3 px-4 pt-2 pb-24 [--grid-color:var(--orange-4)]"
  >
    <Wave className="absolute bottom-full left-0 h-18 w-full text-orange-3" />
    <SectionTitle>ご協賛</SectionTitle>
    {/* 掲載を承認されたスポンサー情報がそろうまでは、カードの位置に予告だけを出す。 */}
    <div className="mt-6 flex aspect-[4/3] w-80 items-center justify-center rounded-3xl border-4 border-orange-6 bg-orange-1 shadow-lg">
      <p className="font-caveat text-5xl font-bold text-orange-11">Coming soon</p>
    </div>
  </section>
);
