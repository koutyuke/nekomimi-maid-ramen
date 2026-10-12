import type { SVGProps } from "react";

// 会場の地図の絵。図形はデザインから書き出したものをそのまま使い、施設名は文字で書く。
// 外枠と、枠からはみ出す部分の切り取りは、地図を表示する側で行う。
export const VenueMapIllustration = ({ className = "", ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 320 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    className={`text-base font-normal ${className}`}
    {...props}
  >
    {/* 背景 */}
    <rect width="320" height="240" className="fill-slate-1" />
    {/* サッカーグラウンドと、その名前 */}
    <rect x="21" y="32" width="238" height="158" rx="79" strokeWidth="2" className="fill-grass-3 stroke-grass-6" />
    <text x="140" y="111" textAnchor="middle" className="fill-slate-12">
      <tspan x="140" dy="-4">
        サッカー
      </tspan>
      <tspan x="140" dy="24">
        グラウンド
      </tspan>
    </text>
    {/* グラウンドの右上に並ぶブース。赤いのが自分たちのブースである。 */}
    <path
      d="M205.769 13.6009L221.224 17.742C222.825 18.1708 223.774 19.8158 223.346 21.4162L221.275 29.1436C220.846 30.744 219.201 31.6938 217.601 31.2649L202.146 27.1238C200.546 26.695 199.596 25.05 200.025 23.4496L202.095 15.7222C202.524 14.1218 204.169 13.172 205.769 13.6009Z"
      strokeWidth="2"
      className="fill-blue-4 stroke-blue-8"
    />
    <path
      d="M234.284 23.8083L247.403 32.9676C248.761 33.9161 249.094 35.7863 248.145 37.1448L243.566 43.7043C242.617 45.0628 240.747 45.3952 239.388 44.4467L226.27 35.2874C224.911 34.3389 224.579 32.4687 225.527 31.1102L230.107 24.5507C231.026 23.2347 232.809 22.8816 234.155 23.7232L234.284 23.8083Z"
      strokeWidth="2"
      className="fill-tomato-4 stroke-tomato-8"
    />
    <path
      d="M257.703 43.3141L266.88 56.4208C267.83 57.778 267.5 59.6486 266.143 60.5989L259.589 65.1874C258.232 66.1377 256.362 65.8078 255.411 64.4506L246.234 51.344C245.284 49.9867 245.614 48.1161 246.971 47.1658L253.524 42.5773C254.839 41.6567 256.636 41.9376 257.611 43.19L257.703 43.3141Z"
      strokeWidth="2"
      className="fill-blue-4 stroke-blue-8"
    />
    <path
      d="M273.021 69.6637L277.146 85.1229C277.573 86.7237 276.621 88.3677 275.02 88.7949L267.291 90.8572C265.69 91.2843 264.046 90.3328 263.619 88.732L259.494 73.2728C259.067 71.6719 260.019 70.0279 261.619 69.6008L269.349 67.5384C270.9 67.1247 272.491 68.0047 272.977 69.5156L273.021 69.6637Z"
      strokeWidth="2"
      className="fill-blue-4 stroke-blue-8"
    />
    {/* 下端の建物(体育館・工場・プール)と、それぞれの名前 */}
    <path
      d="M144 209H207C208.657 209 210 210.343 210 212V239H141V212C141 210.343 142.343 209 144 209Z"
      strokeWidth="2"
      className="fill-slate-4 stroke-slate-7"
    />
    <text x="175.5" y="229" textAnchor="middle" className="fill-slate-12">
      体育館
    </text>
    <path
      d="M24 209H70C71.6569 209 73 210.343 73 212V239H21V212C21 210.343 22.3431 209 24 209Z"
      strokeWidth="2"
      className="fill-slate-4 stroke-slate-7"
    />
    <text x="47" y="229" textAnchor="middle" className="fill-slate-12">
      工場
    </text>
    <path
      d="M236 209H316C317.657 209 319 210.343 319 212V239H233V212C233 210.343 234.343 209 236 209Z"
      strokeWidth="2"
      className="fill-slate-4 stroke-slate-7"
    />
    <text x="276" y="229" textAnchor="middle" className="fill-slate-12">
      プール
    </text>
    {/* 右端のテニスコートと、その名前 */}
    <path
      d="M292 32H316C317.657 32 319 33.3431 319 35V187C319 188.657 317.657 190 316 190H292C290.343 190 289 188.657 289 187V35C289 33.3431 290.343 32 292 32Z"
      strokeWidth="2"
      className="fill-grass-3 stroke-grass-6"
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
  </svg>
);
