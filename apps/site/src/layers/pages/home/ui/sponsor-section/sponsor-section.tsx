import { HOME_SECTION_IDS } from "../../../../shared/config";
import { Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";

// 区画と、上端の波で同じ背景を使う。
const BACKGROUND = "bg-orange-3 bg-dashed-grid [--grid-color:var(--orange-4)]";

export const SponsorSection = () => (
  <section
    id={HOME_SECTION_IDS.sponsors}
    aria-label="ご協賛"
    className={`relative flex scroll-mt-24 flex-col items-center px-6 pt-2 pb-24 ${BACKGROUND}`}
  >
    <Wave className={BACKGROUND} />
    <SectionTitle>ご協賛</SectionTitle>
    {/* 掲載を承認されたスポンサー情報がそろうまでは、カードの位置に予告だけを出す。 */}
    <div className="@container mt-6 flex aspect-4/3 w-full max-w-content items-center justify-center squircle-4xl border-4 border-orange-6 bg-orange-1 shadow-lg">
      <p className="font-caveat text-[15cqw] leading-none font-bold text-orange-11">Coming soon</p>
    </div>
  </section>
);
