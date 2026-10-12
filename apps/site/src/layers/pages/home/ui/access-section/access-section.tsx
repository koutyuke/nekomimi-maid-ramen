import { HOME_SECTION_IDS } from "../../../../shared/config";
import { Reveal, Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";
import { VenueMap } from "./venue-map/venue-map";

const ACCESS_ROWS = [
  { label: "Date", value: "10/24(土)・25(日)", note: "一般公開は10/24(土)のみ" },
  { label: "Open", value: "10:00〜16:00", note: "ご注文は15:30まで" },
  { label: "Place", value: "茨城高専\nサッカー場", note: null },
] as const;

export const AccessSection = () => (
  <section
    id={HOME_SECTION_IDS.access}
    aria-label="アクセス"
    className="relative flex scroll-mt-24 flex-col items-center bg-slate-1 bg-dots px-6 pt-6 pb-32 [--grid-color:var(--slate-4)]"
  >
    <Wave className="bg-slate-1 bg-dots [--grid-color:var(--slate-4)]" variant="inverted" />
    <SectionTitle>アクセス</SectionTitle>
    <Reveal className="mt-6 w-full max-w-content">
      <dl className="grid grid-cols-[72px_1fr] gap-1 squircle-4xl border-4 border-dashed border-teal-6 bg-teal-2 p-8">
        {ACCESS_ROWS.map(({ label, value, note }) => (
          <div key={label} className="col-span-2 grid grid-cols-subgrid">
            <dt className="font-caveat text-2xl leading-8 font-bold text-teal-9">{label}</dt>
            <dd className="text-xl leading-8 font-bold whitespace-pre-line text-teal-12">
              {value}
              {note !== null && <span className="block text-xs leading-6 font-normal text-pink">{note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
    <Reveal className="mt-8 w-full max-w-content">
      <VenueMap />
    </Reveal>
    <Reveal className="mt-6">
      <p className="text-md text-tomato-12">雨天時は時計台周りのロータリーで開催します</p>
    </Reveal>
  </section>
);
