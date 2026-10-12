import { HOME_SECTION_IDS } from "../../../../shared/config";
import { Wave } from "../../../../shared/ui";
import { SectionTitle } from "../section-title/section-title";
import { VenueMap } from "./venue-map/venue-map";

// 区画と、上端の波で同じ背景を使う。
const BACKGROUND = "bg-tomato-1 bg-dots [--grid-color:var(--slate-4)]";

const ACCESS_ROWS = [
  { label: "Date", value: "10/24(土)・25(日)", note: "一般公開は10/24(土)のみ" },
  { label: "Open", value: "10:00〜16:00", note: "ご注文は15:30まで" },
  { label: "Place", value: "茨城高専\nサッカー場", note: null },
] as const;

export const AccessSection = () => (
  <section
    id={HOME_SECTION_IDS.access}
    aria-label="アクセス"
    className={`relative flex scroll-mt-24 flex-col items-center px-4 pt-2 pb-24 ${BACKGROUND}`}
  >
    <Wave className={BACKGROUND} variant="inverted" />
    <SectionTitle>アクセス</SectionTitle>
    <dl className="mt-6 grid w-80 grid-cols-[72px_1fr] gap-1 rounded-3xl border-4 border-dashed border-teal-6 bg-teal-2 p-8">
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
    <div className="mt-8">
      <VenueMap />
    </div>
    <p className="mt-6 text-sm text-tomato-12">雨天時は体育館の中で開催します</p>
  </section>
);
