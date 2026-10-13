import { X } from "lucide-react";

import { HOME_SECTION_IDS } from "../../../../shared/config";
import { ScribbleArrow } from "../../../../shared/ui";
import HonkakuRamenLogo from "../../assets/honkaku-ramen.svg?react";
import NekomimiMaidLogo from "../../assets/nekomimi-maid.svg?react";
import { InstaxCard } from "./instax-card/instax-card";

export const HeroSection = () => (
  <section
    id={HOME_SECTION_IDS.top}
    aria-labelledby="hero-title"
    className="flex scroll-mt-24 flex-col items-center justify-center bg-slate-1 bg-dots px-5 pt-32 pb-34 text-center [--grid-color:var(--slate-4)]"
  >
    <h1 id="hero-title" className="flex w-full max-w-content flex-col items-center">
      <span className="sr-only">ねこみみメイド × 本格らーめん</span>
      <NekomimiMaidLogo className="w-7/10 fill-tomato-9 drop-shadow-[0_8px_5px_rgb(0_0_0/0.1),0_20px_12.5px_rgb(0_0_0/0.1)]" />
      <X aria-hidden className="mt-4 size-9 text-slate-11" />
      <HonkakuRamenLogo className="mt-3 w-4/5 fill-slate-12 drop-shadow-[0_8px_5px_rgb(0_0_0/0.1),0_20px_12.5px_rgb(0_0_0/0.1)]" />
    </h1>
    <p className="text-md mt-8 text-slate-11">
      猫耳をつけたメイドさんが給仕する
      <br />
      超本格ラーメン屋さんです！
      <br />
      茨香祭の2日間の限定開催！
      <br />
      ぜひ、ご賞味あれ！！
    </p>
    <div className="mt-8">
      <InstaxCard />
    </div>
    <p className="mt-4 flex -rotate-4 flex-col items-center font-caveat text-xl font-normal text-slate-10">
      <ScribbleArrow className="h-8" />
      <span className="px-1">Tap to flip!</span>
    </p>
  </section>
);
