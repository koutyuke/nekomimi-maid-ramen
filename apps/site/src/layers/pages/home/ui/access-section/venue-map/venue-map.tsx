import { useId } from "react";

import { ScribbleArrow } from "../../../../../shared/ui";
import { VenueMapIllustration } from "./venue-map-illustration";

export const VenueMap = () => {
  const captionId = useId();
  return (
    <figure aria-labelledby={captionId} className="@container relative">
      <figcaption id={captionId} className="sr-only">
        会場の地図。サッカーグラウンドの右上、テニスコートの近くに弧を描いて並ぶ4つのブースのうち、左から2番目の赤いブースが猫耳メイドラーメンのブースです。下側には工場、体育館、プールがあります。
      </figcaption>
      {/* 枠の太さを地図の大きさに関わらず一定にするため、枠と切り取りは外側で行う。 */}
      <div className="overflow-hidden squircle-4xl border-4 border-slate-6">
        <VenueMapIllustration className="block w-full" />
      </div>
      {/* 地図と一緒に拡大・縮小するよう、幅320pxのデザイン基準(1px = 0.3125cqw)で置く。 */}
      <div aria-hidden className="absolute top-[-10cqw] left-[76.5625cqw] flex rotate-5 flex-col items-start">
        <span className="mb-[-0.625cqw] font-caveat text-[7.5cqw] leading-[10cqw] font-normal text-pink">Here</span>
        <ScribbleArrow className="ml-[2.5cqw] h-[10cqw] w-[4.375cqw] -rotate-139 text-pink" />
      </div>
    </figure>
  );
};
