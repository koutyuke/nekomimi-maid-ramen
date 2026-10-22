import { Link } from "@tanstack/react-router";

import { SPONSORS } from "../../../../entities/sponsor";
import { HOME_SECTION_IDS } from "../../../../shared/config";
import { BlurImage, Reveal, Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";

export const SponsorSection = () => (
  <section
    id={HOME_SECTION_IDS.sponsors}
    aria-label="ご協賛"
    className="bg-dashed-grid relative flex scroll-mt-24 flex-col items-center bg-orange-3 px-6 pt-2 pb-32 [--grid-color:var(--orange-4)]"
  >
    <Wave className="bg-dashed-grid bg-orange-3 [--grid-color:var(--orange-4)]" />
    <SectionTitle>ご協賛</SectionTitle>
    <div className="mt-6 flex w-full max-w-content flex-col gap-6">
      {SPONSORS.map(({ name, path, logo }) => (
        <Reveal key={path}>
          <Link
            to={path}
            className="block aspect-4/3 w-full overflow-hidden squircle-4xl border-4 border-orange-6 bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
          >
            <BlurImage {...logo} alt={name} fit="contain" className="size-full" />
          </Link>
        </Reveal>
      ))}
    </div>
  </section>
);
