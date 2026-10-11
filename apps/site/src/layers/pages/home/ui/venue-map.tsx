import { ScribbleArrow } from "./scribble-arrow";

// 角を丸めた長方形を斜めに置いたブース。座標はデザインの地図(320×240)のまま使う。
const BOOTHS: readonly { d: string; ours?: boolean }[] = [
  {
    d: "M205.769 13.6009L221.224 17.742C222.825 18.1708 223.774 19.8158 223.346 21.4162L221.275 29.1436C220.846 30.744 219.201 31.6938 217.601 31.2649L202.146 27.1238C200.546 26.695 199.596 25.05 200.025 23.4496L202.095 15.7222C202.524 14.1218 204.169 13.172 205.769 13.6009Z",
  },
  {
    d: "M234.284 23.8083L247.403 32.9677C248.761 33.9162 249.094 35.7863 248.145 37.1448L243.566 43.7043C242.617 45.0628 240.747 45.3952 239.388 44.4467L226.27 35.2874C224.911 34.3389 224.579 32.4688 225.527 31.1102L230.107 24.5508C231.055 23.1923 232.925 22.8599 234.284 23.8083Z",
    ours: true,
  },
  {
    d: "M257.703 43.3141L266.88 56.4208C267.83 57.778 267.5 59.6486 266.143 60.5989L259.589 65.1874C258.232 66.1377 256.362 65.8078 255.411 64.4506L246.234 51.344C245.284 49.9867 245.614 48.1161 246.971 47.1658L253.524 42.5773C254.882 41.627 256.752 41.9569 257.703 43.3141Z",
  },
  {
    d: "M273.021 69.6637L277.146 85.1229C277.573 86.7238 276.621 88.3678 275.02 88.7949L267.291 90.8572C265.69 91.2843 264.046 90.3329 263.619 88.732L259.494 73.2728C259.067 71.6719 260.019 70.0279 261.619 69.6008L269.349 67.5385C270.95 67.1114 272.594 68.0628 273.021 69.6637Z",
  },
];

// 下端の建物。上の角だけを丸める。
const BUILDINGS: readonly { d: string; label: string; x: number }[] = [
  {
    d: "M144 209H207C208.657 209 210 210.343 210 212V239H141V212C141 210.343 142.343 209 144 209Z",
    label: "体育館",
    x: 175.5,
  },
  { d: "M24 209H70C71.6569 209 73 210.343 73 212V239H21V212C21 210.343 22.3431 209 24 209Z", label: "工場", x: 47 },
  {
    d: "M236 209H316C317.657 209 319 210.343 319 212V239H233V212C233 210.343 234.343 209 236 209Z",
    label: "プール",
    x: 276,
  },
];

const FACILITY_CLASS = "fill-slate-4 stroke-slate-7";

export const VenueMap = () => (
  <figure className="relative w-80">
    {/* 地図は見た目で示し、出店位置は同じ内容を文章で伝える。 */}
    <figcaption className="sr-only">
      会場の地図。サッカーグラウンドの右上、テニスコートの近くに弧を描いて並ぶ4つのブースのうち、左から2番目の赤いブースが猫耳メイドラーメンのブースです。下側には工場、体育館、プールがあります。
    </figcaption>
    <svg viewBox="0 0 320 240" aria-hidden className="block w-full overflow-hidden rounded-3xl text-base font-normal">
      <rect width="320" height="240" rx="24" className="fill-slate-1" />
      <rect x="21" y="32" width="238" height="158" rx="79" strokeWidth="2" className="fill-grass-3 stroke-grass-6" />
      <text x="140" y="111" textAnchor="middle" className="fill-slate-12">
        <tspan x="140" dy="-4">
          サッカー
        </tspan>
        <tspan x="140" dy="24">
          グラウンド
        </tspan>
      </text>

      <path
        d="M292 32H316C317.657 32 319 33.3431 319 35V187C319 188.657 317.657 190 316 190H292C290.343 190 289 188.657 289 187V35C289 33.3431 290.343 32 292 32Z"
        strokeWidth="2"
        className={FACILITY_CLASS}
      />
      <text
        x="304"
        y="111"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 304 111)"
        className="fill-slate-12"
      >
        テニスコート
      </text>

      {BUILDINGS.map(({ d, label, x }) => (
        <g key={label}>
          <path d={d} strokeWidth="2" className={FACILITY_CLASS} />
          <text x={x} y="229" textAnchor="middle" className="fill-slate-12">
            {label}
          </text>
        </g>
      ))}

      {BOOTHS.map(({ d, ours }) => (
        <path
          key={d}
          d={d}
          strokeWidth="2"
          className={ours ? "fill-tomato-4 stroke-tomato-8" : "fill-blue-4 stroke-blue-8"}
        />
      ))}
      <rect x="2" y="2" width="316" height="236" rx="22" fill="none" strokeWidth="4" className="stroke-slate-6" />
    </svg>
    {/* 自分たちのブースを指す手書きの注記。地図の枠の上にはみ出して置く。 */}
    <div aria-hidden className="absolute -top-8 left-[245px] flex rotate-5 flex-col items-start">
      <span className="-mb-0.5 font-caveat text-2xl font-[400] text-pink">Here</span>
      <ScribbleArrow className="ml-2 h-8 w-3.5 -rotate-139 text-pink" />
    </div>
  </figure>
);
