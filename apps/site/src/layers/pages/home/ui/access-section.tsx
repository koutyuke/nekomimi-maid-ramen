import { Wave } from "../../../shared/ui";
import { HOME_SECTION_IDS } from "../model/sections";
import { SectionTitle } from "./section-title";

export const AccessSection = () => (
  <section
    id={HOME_SECTION_IDS.access}
    aria-label="アクセス"
    className="bg-dots relative flex scroll-mt-24 flex-col items-center bg-tomato-1 px-4 pt-2 pb-24 [--grid-color:var(--tomato-4)]"
  >
    <Wave className="absolute bottom-full left-0 h-18 w-full -scale-x-100 text-tomato-1" />
    <SectionTitle>アクセス</SectionTitle>
    <p className="mt-6 text-sm text-tomato-12">雨天時は体育館の中で開催します</p>
  </section>
);
