import { HOME_SECTION_IDS } from "../../../../shared/config";
import { Reveal, Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";

export const SponsorSection = () => (
  <section
    id={HOME_SECTION_IDS.sponsors}
    aria-label="ご協賛"
    className="bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-orange-3 px-6 pt-2 pb-32 [--grid-color:var(--orange-4)]"
  >
    <Wave className="bg-dashed-grid bg-orange-3 [--grid-color:var(--orange-4)]" />
    <SectionTitle>ご協賛</SectionTitle>
    {/* 掲載を承認されたスポンサー情報がそろうまでは予告だけを出す。 */}
    <Reveal className="@container mt-6 flex aspect-4/3 w-full max-w-content items-center justify-center squircle-4xl border-4 border-orange-6 bg-orange-1 shadow-lg">
      <p className="font-caveat text-[15cqw] leading-none font-normal text-orange-11">Coming soon</p>
    </Reveal>
  </section>
);
