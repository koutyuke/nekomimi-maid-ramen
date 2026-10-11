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
  </section>
);
